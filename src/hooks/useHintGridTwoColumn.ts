import { useSyncExternalStore } from "react";

// HintList.tsx のグリッドは md（768px）以上で2列になる。useIsDesktop の
// lg（1024px）とは別の閾値なので専用のフックにしている
const TWO_COLUMN_QUERY = "(min-width: 768px)";

// MediaQueryListの生成コストを避けるため、初回アクセス時に一度だけ作って使い回す。
// jsdom など matchMedia を持たない環境では1列扱いにフォールバックする
let cachedMql: MediaQueryList | null | undefined;

function matchTwoColumn(): MediaQueryList | null {
  if (cachedMql === undefined) {
    cachedMql =
      typeof window.matchMedia === "function" ? window.matchMedia(TWO_COLUMN_QUERY) : null;
  }
  return cachedMql;
}

function subscribe(onStoreChange: () => void) {
  const mql = matchTwoColumn();
  if (!mql) return () => {};
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

/**
 * HintList（"mobile" layout）のヒントカードが現在2列表示かどうか。「？」枠の高さ見積もり
 * （MobileQuizLayout）で、全開示時の行数をグリッドの実際の列数に合わせるために使う。
 */
export function useIsHintGridTwoColumn(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => matchTwoColumn()?.matches ?? false,
    () => false,
  );
}
