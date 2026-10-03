import { useSyncExternalStore } from "react";

// md では2カラムが窮屈なので lg 以上をデスクトップ扱いにする。ヘッダー（md 切替）とは意図的に揃えない
const DESKTOP_QUERY = "(min-width: 1024px)";

// matchMedia を持たない jsdom ではモバイル扱いにする
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
