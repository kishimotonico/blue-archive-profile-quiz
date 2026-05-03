export const CURRENT_ALGORITHM_VERSION = 1;

export interface QuizKey {
  version: number;
  baseDate: string;
  seed: number;
}

const KEY_PATTERN = /^v(\d+)\.(\d{4}-\d{2}-\d{2})\.(\d+)$/;

export function encodeQuizKey(key: QuizKey): string {
  return `v${key.version}.${key.baseDate}.${key.seed}`;
}

export function decodeQuizKey(s: string): QuizKey {
  const m = s.match(KEY_PATTERN);
  if (!m) throw new Error(`Invalid QuizKey: ${s}`);
  return { version: Number(m[1]), baseDate: m[2], seed: Number(m[3]) };
}
