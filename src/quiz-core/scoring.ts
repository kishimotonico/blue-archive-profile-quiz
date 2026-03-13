/**
 * スコア計算ロジック
 */

/**
 * 開示したヒント数に応じてスコアを計算
 * - 1ヒント: 10点
 * - 2ヒント: 9点
 * - 3ヒント: 8点
 * - ...
 * - 9ヒント: 2点
 * - 立ち絵（10）: 1点
 * - 不正解: 0点
 */
export function calculateScore(revealedHintCount: number, correct: boolean): number {
  if (!correct) {
    return 0;
  }

  // ヒント数が1〜10の範囲（10は立ち絵表示時）
  const score = Math.max(1, 11 - revealedHintCount);
  return score;
}

/**
 * 最大スコアを取得
 */
export function getMaxScore(): number {
  return 10;
}

/**
 * スコアのランク判定
 * - 10点: SS
 * - 8-9点: S
 * - 6-7点: A
 * - 4-5点: B
 * - 1-3点: C
 * - 0点: D
 */
export function getScoreRank(score: number): 'SS' | 'S' | 'A' | 'B' | 'C' | 'D' {
  if (score >= 10) return 'SS';
  if (score >= 8) return 'S';
  if (score >= 6) return 'A';
  if (score >= 4) return 'B';
  if (score >= 1) return 'C';
  return 'D';
}
