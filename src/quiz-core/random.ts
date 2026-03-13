/**
 * シンプルなシード付き乱数生成器（LCG実装）
 */
export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Fisher-Yates シャッフル（破壊的）
 * @param array シャッフル対象の配列（コピー済みであること）
 * @param randomFn 乱数生成関数（省略時は Math.random）
 */
export function shuffle<T>(array: T[], randomFn: () => number = Math.random): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
