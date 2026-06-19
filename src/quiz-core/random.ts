export function seededRandomV1(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

export function shuffleV1<T>(array: T[], seed: number): T[] {
  const rng = seededRandomV1(seed);
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function deriveSeedV1(master: number, tag: string, index = 0): number {
  let h = master ^ 0x9e3779b9;
  for (const ch of tag) h = (((h << 5) - h) + ch.charCodeAt(0)) | 0;
  h = (h * 16777619) ^ index;
  return h >>> 0;
}

// --- v2: mulberry32 ベースの整数安全 PRNG ---

/**
 * mulberry32 アルゴリズムによる疑似乱数生成器。
 * Math.imul を使って 32bit 整数演算の精度を保証する。
 */
export function seededRandomV2(seed: number): () => number {
  // seed を 32bit 符号なし整数に正規化
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 15), z | 1) >>> 0;
    z = (z ^ (z + Math.imul(z ^ (z >>> 7), z | 61))) >>> 0;
    z = (z ^ (z >>> 14)) >>> 0;
    return z / 0x100000000;
  };
}

export function shuffleV2<T>(array: T[], seed: number): T[] {
  const rng = seededRandomV2(seed);
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
