import { useSyncExternalStore } from "react";

// md（768px）幅では2カラムにするとヒントも立ち絵も窮屈になるため、lg以上をデスクトップ扱いにする
const DESKTOP_QUERY = "(min-width: 1024px)";

// MediaQueryListの生成コストを避けるため、初回アクセス時に一度だけ作って使い回す。
// jsdom など matchMedia を持たない環境ではモバイル扱いにフォールバックする
let cachedMql: MediaQueryList | null | undefined;

function matchDesktop(): MediaQueryList | null {
  if (cachedMql === undefined) {
    cachedMql = typeof window.matchMedia === "function" ? window.matchMedia(DESKTOP_QUERY) : null;
  }
  return cachedMql;
}

function subscribe(onStoreChange: () => void) {
  const mql = matchDesktop();
  if (!mql) return () => {};
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

/**
 * 回答エリアや立ち絵の配置がモバイルと大きく異なり、同じ要素を2箇所に描画すると
 * 入力状態やフォーカス対象が二重になるため、CSSではなく描画自体を出し分ける。
 */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => matchDesktop()?.matches ?? false,
    () => false,
  );
}
