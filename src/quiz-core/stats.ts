import type { QuestionRecord } from "./types";
import type { ScoreRank } from "./scoring";
import { getScoreRank } from "./scoring";

export interface RecordStats {
  totalAttempts: number;
  bestScore: number;
  rankCounts: Record<ScoreRank, number>;
}

/**
 * ランクは表示時点の getScoreRank で計算する。score は記録済みの値をそのまま使い、再計算しない
 * （採点基準が変わっても過去の記録が変わらないようにするため）
 */
export function summarizeRecords(records: readonly QuestionRecord[]): RecordStats {
  const rankCounts: Record<ScoreRank, number> = { SS: 0, S: 0, A: 0, B: 0, C: 0, D: 0 };
  let bestScore = 0;
  for (const { result } of records) {
    rankCounts[getScoreRank(result.score)] += 1;
    bestScore = Math.max(bestScore, result.score);
  }
  return { totalAttempts: records.length, bestScore, rankCounts };
}
