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
 * スコアのランク判定（オプション）
 */
export function getScoreRank(score: number): string {
  if (score >= 10) return 'S';
  if (score >= 8) return 'A';
  if (score >= 6) return 'B';
  if (score >= 4) return 'C';
  if (score >= 1) return 'D';
  return 'F';
}
