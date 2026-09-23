import { useSyncExternalStore } from "react";

// lg 以上を「デスクトップ2カラム」レイアウトの対象とする。
// md（768px）幅では左右2カラムにするとヒントも立ち絵も窮屈になるため、モバイル型を使う。
const DESKTOP_QUERY = "(min-width: 1024px)";

// jsdom など matchMedia を持たない環境ではモバイル扱いにフォールバックする
function matchDesktop(): MediaQueryList | null {
  return typeof window.matchMedia === "function" ? window.matchMedia(DESKTOP_QUERY) : null;
}

function subscribe(onStoreChange: () => void) {
  const mql = matchDesktop();
  if (!mql) return () => {};
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

/**
 * デスクトップ2カラムレイアウトを使うかどうか。
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
