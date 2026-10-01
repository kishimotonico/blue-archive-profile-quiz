import type { SetStateAction, WritableAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import * as v from "valibot";

export interface Migration {
  from: number; // この schemaVersion の文書に当て、from + 1 の文書を返す
  migrate: (doc: unknown) => unknown;
}

export interface LegacyImport {
  key: string; // 旧形式の localStorage キー
  import: (doc: unknown) => unknown; // JSON として読めた旧文書 → いずれかの schemaVersion を持つ文書
}

export interface PersistedDocumentOptions<T> {
  key: string;
  schema: v.GenericSchema<T>; // 現在の形だけを知る。全階層 looseObject
  empty: T;
  migrations: Migration[]; // from 昇順で並べる（並べ替えない）
  legacyImports: LegacyImport[]; // 本体キーが無いときだけ、先頭から順に試す
}

// jotai の SyncStorage<T> と構造的に一致させる。jotai/utils は SyncStorage を export していないので自前で持つ
export interface DocumentStorage<T> {
  getItem: (key: string, initialValue: T) => T;
  setItem: (key: string, newValue: T) => void;
  removeItem: (key: string) => void;
  subscribe: (key: string, callback: (value: T) => void, initialValue: T) => () => void;
}

export interface PersistedDocument<T> {
  atom: WritableAtom<T, [SetStateAction<T>], void>;
  parse: (raw: string | null) => T; // 副作用なし。将来のインポート機能もこれを使う
  storage: DocumentStorage<T>; // 保存層の境界。テストはここを直接叩く
}

export function definePersistedDocument<T>({
  key,
  schema,
  empty,
  migrations,
  legacyImports,
}: PersistedDocumentOptions<T>): PersistedDocument<T> {
  // ---- 副作用なし ----
  const readJson = (raw: string | null): unknown => {
    if (raw === null) return undefined;
    try {
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  };

  const schemaVersionOf = (doc: unknown): unknown =>
    typeof doc === "object" && doc !== null
      ? (doc as { schemaVersion?: unknown }).schemaVersion
      : undefined;

  const normalize = (json: unknown): { doc: T; migrated: boolean } => {
    let current = json;
    let migrated = false;
    for (const m of migrations) {
      // migrations は from 昇順前提
      if (schemaVersionOf(current) === m.from) {
        current = m.migrate(current);
        migrated = true;
      }
    }
    const result = v.safeParse(schema, current);
    // 検証に落ちたら empty。壊れたデータを部分的に救わない（仕様）
    return { doc: result.success ? result.output : empty, migrated };
  };

  const parse = (raw: string | null): T => normalize(readJson(raw)).doc;

  // ---- 副作用あり（getItem だけ） ----
  // 引数 (key, initialValue) は jotai の契約で受け取るが、閉包の key / empty と同じ値なので使わない
  const getItem = (): T => {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const { doc, migrated } = normalize(readJson(raw));
      // 保存し直すのは移行が当たったときだけ。検証に落ちた文書は上書きしない。
      // 新しいコードが schemaVersion を上げた文書を、更新前から開いていた古いタブが読んで消さないため。
      // JSON 文字列の比較で判定しないのは、looseObject がキー順を並べ替えるので移行が無くても不一致になるため
      if (migrated) localStorage.setItem(key, JSON.stringify(doc));
      return doc;
    }
    for (const legacy of legacyImports) {
      const legacyRaw = localStorage.getItem(legacy.key);
      if (legacyRaw === null) continue;
      const { doc } = normalize(legacy.import(readJson(legacyRaw)));
      // 取り込めない旧文書は empty を書いて捨てる。旧キーを残しても次回同じ結果になるだけ
      localStorage.setItem(key, JSON.stringify(doc));
      localStorage.removeItem(legacy.key);
      return doc;
    }
    return empty; // 何も無ければ書かない（初訪問でキーを作らない）
  };

  const storage: DocumentStorage<T> = {
    getItem,
    setItem: (_key, value) => localStorage.setItem(key, JSON.stringify(value)),
    removeItem: () => localStorage.removeItem(key),
    subscribe: (_key, callback) => {
      // 別タブの更新も parse を通す。sessionStorage のイベントも同じ window に届くので storageArea で絞る。
      // 別タブでキーが消えれば newValue は null → empty
      const onStorage = (e: StorageEvent) => {
        if (e.storageArea === localStorage && e.key === key) callback(parse(e.newValue));
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    },
  };

  const atom = atomWithStorage<T>(key, empty, storage, { getOnInit: true });
  return { atom, parse, storage };
}
