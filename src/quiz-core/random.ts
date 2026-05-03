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
