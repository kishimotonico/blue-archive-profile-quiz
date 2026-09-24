import { useSyncExternalStore } from "react";

// Modalはクイズ専用ではなく画面全体で使う共通部品のため、jotaiのクイズ用store（store/quiz.ts）
// には置かず、Modal自身が開閉に合わせて登録・解除するだけの独立したレジストリにしている。
let openCount = 0;
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) listener();
}

/**
 * Modalが開いている間だけ呼び出し側で呼ぶ。戻り値のクリーンアップ関数を
 * 閉じるタイミング（アンマウントも含む）で必ず呼ぶこと。
 */
export function registerDialogOpen(): () => void {
  openCount += 1;
  emitChange();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    openCount -= 1;
    emitChange();
  };
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getSnapshot() {
  return openCount > 0;
}

/**
 * 画面上にModalが1つ以上開いているかを購読する。Escapeやフォーカストラップの
 * 二重処理を避けるため、他のモーダルの開閉と連動させたい箇所（例:
 * 結果モーダルの自動表示の待機）で使う。
 */
export function useIsAnyDialogOpen(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
