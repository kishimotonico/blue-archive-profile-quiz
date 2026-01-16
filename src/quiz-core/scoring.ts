/**
 * スコア計算ロジック
 */

/**
 * 開示したヒント数に応じてスコアを計算
 * - 1ヒント: 9点
 * - 2ヒント: 8点
 * - 3ヒント: 7点
 * - ...
 * - 9ヒント: 1点
 * - 不正解: 0点
 */
export function calculateScore(revealedHintCount: number, correct: boolean): number {
  if (!correct) {
    return 0;
  }

  // ヒント数が1〜9の範囲
  const score = Math.max(0, 10 - revealedHintCount);
  return score;
}

/**
 * 最大スコアを取得
 */
export function getMaxScore(): number {
  return 9;
}

/**
 * スコアのランク判定（オプション）
 */
export function getScoreRank(score: number): string {
  if (score >= 9) return 'S';
  if (score >= 7) return 'A';
  if (score >= 5) return 'B';
  if (score >= 3) return 'C';
  if (score >= 1) return 'D';
  return 'F';
}
