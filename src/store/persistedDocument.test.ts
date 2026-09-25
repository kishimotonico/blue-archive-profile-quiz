// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createStore } from "jotai";
import * as v from "valibot";
import { definePersistedDocument, type Migration, type LegacyImport } from "./persistedDocument";

// daily とは無関係のおもちゃの文書定義で、汎用層だけを検証する。
interface ToyDocV1 {
  schemaVersion: 1;
  names: string[];
}

interface ToyDoc {
  schemaVersion: 2;
  items: { name: string; note?: string }[];
}

const TOY_KEY = "toy-doc";
const TOY_LEGACY_KEY = "toy-legacy";

const emptyToyDoc: ToyDoc = { schemaVersion: 2, items: [] };

const toyItemSchema = v.looseObject({
  name: v.string(),
  note: v.optional(v.string()),
});

const toyDocSchema: v.GenericSchema<ToyDoc> = v.looseObject({
  schemaVersion: v.literal(2),
  items: v.array(toyItemSchema),
});

const migrateV1ToV2: Migration = {
  from: 1,
  migrate: (doc: unknown) => {
    // names は v2 に存在しないフィールドなので、rest から除いて渡す（looseObject が未知フィールドとして残さないため）
    const { names, ...rest } = doc as ToyDocV1;
    return { ...rest, schemaVersion: 2, items: names.map((name) => ({ name })) };
  },
};

const importFromLegacy: LegacyImport = {
  key: TOY_LEGACY_KEY,
  import: (doc: unknown) => {
    // doc の形を先に検証してから変換する（壊れた入力で migrate を実行時エラーにしないため）
    const parsed = v.safeParse(v.array(v.string()), doc);
    if (!parsed.success) return undefined;
    return { schemaVersion: 1, names: parsed.output };
  },
};

function defineToyDocument() {
  return definePersistedDocument<ToyDoc>({
    key: TOY_KEY,
    schema: toyDocSchema,
    empty: emptyToyDoc,
    migrations: [migrateV1ToV2],
    legacyImports: [importFromLegacy],
  });
}

beforeEach(() => {
  localStorage.clear();
});

describe("parse", () => {
  it("null は empty を返す", () => {
    const doc = defineToyDocument();
    expect(doc.parse(null)).toEqual(emptyToyDoc);
  });

  it("壊れた JSON は empty を返す", () => {
    const doc = defineToyDocument();
    expect(doc.parse("{not json")).toEqual(emptyToyDoc);
  });

  it("検証に落ちる文書は empty を返す", () => {
    const doc = defineToyDocument();
    expect(doc.parse(JSON.stringify({ schemaVersion: 2, items: "not an array" }))).toEqual(
      emptyToyDoc,
    );
  });

  it("v1 文書は migrations で v2 に到達する", () => {
    const doc = defineToyDocument();
    const v1: ToyDocV1 = { schemaVersion: 1, names: ["a", "b"] };
    expect(doc.parse(JSON.stringify(v1))).toEqual({
      schemaVersion: 2,
      items: [{ name: "a" }, { name: "b" }],
    });
  });

  it("未知フィールドが文書・items 要素の両方で保持される", () => {
    const doc = defineToyDocument();
    const raw = JSON.stringify({
      schemaVersion: 2,
      extra: "doc-level",
      items: [{ name: "a", extra: "item-level" }],
    });
    const parsed = doc.parse(raw) as ToyDoc & { extra?: string };
    expect(parsed.extra).toBe("doc-level");
    expect((parsed.items[0] as { extra?: string }).extra).toBe("item-level");
  });

  it("note 欠落は欠落のまま保たれる（既定値で埋めない）", () => {
    const doc = defineToyDocument();
    const raw = JSON.stringify({ schemaVersion: 2, items: [{ name: "a" }] });
    const parsed = doc.parse(raw);
    expect("note" in parsed.items[0]).toBe(false);
  });

  it("localStorage に触らない", () => {
    const doc = defineToyDocument();
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    doc.parse(JSON.stringify({ schemaVersion: 1, names: ["a"] }));
    expect(setItemSpy).not.toHaveBeenCalled();
    setItemSpy.mockRestore();
  });
});

describe("storage.getItem", () => {
  it("本体キーがあればその内容を返し、旧キーがあっても読まず消さない", () => {
    const doc = defineToyDocument();
    const current: ToyDoc = { schemaVersion: 2, items: [{ name: "a" }] };
    localStorage.setItem(TOY_KEY, JSON.stringify(current));
    localStorage.setItem(TOY_LEGACY_KEY, JSON.stringify(["b"]));

    expect(doc.storage.getItem(TOY_KEY, emptyToyDoc)).toEqual(current);
    expect(localStorage.getItem(TOY_LEGACY_KEY)).not.toBeNull();
  });

  it("本体キーが無く旧キーがあれば取り込んだ値を返し、本体キーに保存され旧キーが消える", () => {
    const doc = defineToyDocument();
    localStorage.setItem(TOY_LEGACY_KEY, JSON.stringify(["a", "b"]));

    const result = doc.storage.getItem(TOY_KEY, emptyToyDoc);

    expect(result).toEqual({ schemaVersion: 2, items: [{ name: "a" }, { name: "b" }] });
    expect(localStorage.getItem(TOY_KEY)).toBe(JSON.stringify(result));
    expect(localStorage.getItem(TOY_LEGACY_KEY)).toBeNull();
  });

  it("本体キーが v1 なら v2 を返し、localStorage も migrate 後の内容で書き戻される", () => {
    const doc = defineToyDocument();
    const v1: ToyDocV1 = { schemaVersion: 1, names: ["a"] };
    localStorage.setItem(TOY_KEY, JSON.stringify(v1));

    const result = doc.storage.getItem(TOY_KEY, emptyToyDoc);

    expect(result).toEqual({ schemaVersion: 2, items: [{ name: "a" }] });
    expect(localStorage.getItem(TOY_KEY)).toBe(JSON.stringify(result));
  });

  it("本体キーが現在形なら migrate が起きず、localStorage の文字列はシードのまま変わらない", () => {
    const doc = defineToyDocument();
    // キー順をスキーマの出力順（schemaVersion, items）と変えてシードする
    const seeded = JSON.stringify({ items: [{ name: "a" }], schemaVersion: 2 });
    localStorage.setItem(TOY_KEY, seeded);

    const result = doc.storage.getItem(TOY_KEY, emptyToyDoc);

    expect(result).toEqual({ schemaVersion: 2, items: [{ name: "a" }] });
    expect(localStorage.getItem(TOY_KEY)).toBe(seeded);
  });

  it("検証に落ちる本体キーは empty を返し、localStorage の文字列は変わらない", () => {
    const doc = defineToyDocument();
    const broken = JSON.stringify({ schemaVersion: 2, items: "not an array" });
    localStorage.setItem(TOY_KEY, broken);

    const result = doc.storage.getItem(TOY_KEY, emptyToyDoc);

    expect(result).toEqual(emptyToyDoc);
    expect(localStorage.getItem(TOY_KEY)).toBe(broken);
  });

  it("壊れた旧キーは empty を返して本体キーに書き、旧キーが消える", () => {
    const doc = defineToyDocument();
    localStorage.setItem(TOY_LEGACY_KEY, "{not json");

    const result = doc.storage.getItem(TOY_KEY, emptyToyDoc);

    expect(result).toEqual(emptyToyDoc);
    expect(localStorage.getItem(TOY_KEY)).toBe(JSON.stringify(emptyToyDoc));
    expect(localStorage.getItem(TOY_LEGACY_KEY)).toBeNull();
  });

  it("どちらも無ければ empty を返し、localStorage に何も書かない（初訪問でキーを作らない）", () => {
    const doc = defineToyDocument();

    const result = doc.storage.getItem(TOY_KEY, emptyToyDoc);

    expect(result).toEqual(emptyToyDoc);
    expect(localStorage.getItem(TOY_KEY)).toBeNull();
    expect(localStorage.getItem(TOY_LEGACY_KEY)).toBeNull();
  });

  it("二度呼んでも結果と localStorage が変わらない", () => {
    const doc = defineToyDocument();
    localStorage.setItem(TOY_LEGACY_KEY, JSON.stringify(["a"]));

    const first = doc.storage.getItem(TOY_KEY, emptyToyDoc);
    const afterFirstCall = localStorage.getItem(TOY_KEY);
    const second = doc.storage.getItem(TOY_KEY, emptyToyDoc);

    expect(second).toEqual(first);
    expect(localStorage.getItem(TOY_KEY)).toBe(afterFirstCall);
  });
});

describe("storage.setItem / removeItem", () => {
  it("setItem は JSON.stringify(value) を本体キーに書く", () => {
    const doc = defineToyDocument();
    const value: ToyDoc = { schemaVersion: 2, items: [{ name: "a" }] };

    doc.storage.setItem(TOY_KEY, value);

    expect(localStorage.getItem(TOY_KEY)).toBe(JSON.stringify(value));
  });

  it("removeItem は本体キーを消す", () => {
    const doc = defineToyDocument();
    localStorage.setItem(TOY_KEY, JSON.stringify(emptyToyDoc));

    doc.storage.removeItem(TOY_KEY);

    expect(localStorage.getItem(TOY_KEY)).toBeNull();
  });
});

describe("storage.subscribe", () => {
  it("storage イベントで届いた値が parse を通る（v1 → v2 に移行済み）", () => {
    const doc = defineToyDocument();
    const received: ToyDoc[] = [];
    const unsubscribe = doc.storage.subscribe(
      TOY_KEY,
      (value) => received.push(value),
      emptyToyDoc,
    );

    const v1: ToyDocV1 = { schemaVersion: 1, names: ["a"] };
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: TOY_KEY,
        newValue: JSON.stringify(v1),
        storageArea: localStorage,
      }),
    );

    expect(received).toEqual([{ schemaVersion: 2, items: [{ name: "a" }] }]);
    unsubscribe();
  });

  it("壊れた newValue は empty が届く", () => {
    const doc = defineToyDocument();
    const received: ToyDoc[] = [];
    const unsubscribe = doc.storage.subscribe(
      TOY_KEY,
      (value) => received.push(value),
      emptyToyDoc,
    );

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: TOY_KEY,
        newValue: "{not json",
        storageArea: localStorage,
      }),
    );

    expect(received).toEqual([emptyToyDoc]);
    unsubscribe();
  });

  it("newValue: null は empty が届く（別タブでキーが消えた場合）", () => {
    const doc = defineToyDocument();
    const received: ToyDoc[] = [];
    const unsubscribe = doc.storage.subscribe(
      TOY_KEY,
      (value) => received.push(value),
      emptyToyDoc,
    );

    window.dispatchEvent(
      new StorageEvent("storage", { key: TOY_KEY, newValue: null, storageArea: localStorage }),
    );

    expect(received).toEqual([emptyToyDoc]);
    unsubscribe();
  });

  it("別キーのイベントは届かない", () => {
    const doc = defineToyDocument();
    const received: ToyDoc[] = [];
    const unsubscribe = doc.storage.subscribe(
      TOY_KEY,
      (value) => received.push(value),
      emptyToyDoc,
    );

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "other-key",
        newValue: JSON.stringify(emptyToyDoc),
        storageArea: localStorage,
      }),
    );

    expect(received).toEqual([]);
    unsubscribe();
  });

  it("storageArea が sessionStorage のイベントは届かない", () => {
    const doc = defineToyDocument();
    const received: ToyDoc[] = [];
    const unsubscribe = doc.storage.subscribe(
      TOY_KEY,
      (value) => received.push(value),
      emptyToyDoc,
    );

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: TOY_KEY,
        newValue: JSON.stringify(emptyToyDoc),
        storageArea: sessionStorage,
      }),
    );

    expect(received).toEqual([]);
    unsubscribe();
  });

  it("解除後は届かない", () => {
    const doc = defineToyDocument();
    const received: ToyDoc[] = [];
    const unsubscribe = doc.storage.subscribe(
      TOY_KEY,
      (value) => received.push(value),
      emptyToyDoc,
    );
    unsubscribe();

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: TOY_KEY,
        newValue: JSON.stringify(emptyToyDoc),
        storageArea: localStorage,
      }),
    );

    expect(received).toEqual([]);
  });
});

describe("atom の結線", () => {
  it("localStorage をシードしてから definePersistedDocument すると、atom の初期値がシードの内容になる（getOnInit）", () => {
    const seeded: ToyDoc = { schemaVersion: 2, items: [{ name: "seeded" }] };
    localStorage.setItem(TOY_KEY, JSON.stringify(seeded));

    const doc = defineToyDocument();
    const store = createStore();

    expect(store.get(doc.atom)).toEqual(seeded);
  });

  it("マウント後に storage イベントを dispatch すると、atom が parse 済みの値になる（購読 → setAtom）", () => {
    const doc = defineToyDocument();
    const store = createStore();
    const unsubscribe = store.sub(doc.atom, () => {});

    const v1: ToyDocV1 = { schemaVersion: 1, names: ["a"] };
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: TOY_KEY,
        newValue: JSON.stringify(v1),
        storageArea: localStorage,
      }),
    );

    expect(store.get(doc.atom)).toEqual({ schemaVersion: 2, items: [{ name: "a" }] });
    unsubscribe();
  });

  it("store.set で localStorage に JSON が書かれる", () => {
    const doc = defineToyDocument();
    const store = createStore();
    const next: ToyDoc = { schemaVersion: 2, items: [{ name: "a" }] };

    store.set(doc.atom, next);

    expect(localStorage.getItem(TOY_KEY)).toBe(JSON.stringify(next));
  });
});
