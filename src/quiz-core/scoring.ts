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
  const score = Math.min(getMaxScore(), Math.max(1, 11 - revealedHintCount));
  return score;
}

/**
 * 最大スコアを取得
 */
export function getMaxScore(): number {
  return 10;
}

export type ScoreRank = "SS" | "S" | "A" | "B" | "C" | "D";

/**
 * スコアのランクの区切り（点数の高い順）。getScoreRank とランク分布のラベルの
 * 両方をここから導くことで、区切りを変えたときにラベルだけ古いまま残るのを防ぐ
 */
export const SCORE_RANKS: readonly { rank: ScoreRank; min: number; max: number }[] = [
  { rank: "SS", min: 10, max: 10 },
  { rank: "S", min: 8, max: 9 },
  { rank: "A", min: 6, max: 7 },
  { rank: "B", min: 4, max: 5 },
  { rank: "C", min: 1, max: 3 },
  { rank: "D", min: 0, max: 0 },
];

/**
 * スコアのランク判定
 */
export function getScoreRank(score: number): ScoreRank {
  return (SCORE_RANKS.find((r) => score >= r.min) ?? SCORE_RANKS[SCORE_RANKS.length - 1]).rank;
}

/** ランク分布の表示用ラベル（例: "S (8-9点)"） */
export function getScoreRankLabel(rank: ScoreRank): string {
  const def = SCORE_RANKS.find((r) => r.rank === rank) ?? SCORE_RANKS[SCORE_RANKS.length - 1];
  const range = def.min === def.max ? `${def.min}` : `${def.min}-${def.max}`;
  return `${rank} (${range}点)`;
}
