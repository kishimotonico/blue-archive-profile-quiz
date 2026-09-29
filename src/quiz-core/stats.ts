import type { QuestionRecord, QuestionResult } from "./types";
import type { ScoreRank } from "./scoring";
import { getScoreRank, getMaxScore } from "./scoring";

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

export interface ResultsSummary {
  totalScore: number;
  correctCount: number;
  maxScore: number;
}

/** プレイ中の1セッション分の集計。summarizeRecords と違い、記録済みの正誤・得点をそのまま合算する */
export function summarizeResults(results: readonly QuestionResult[]): ResultsSummary {
  let totalScore = 0;
  let correctCount = 0;
  for (const r of results) {
    totalScore += r.score;
    if (r.correct) correctCount += 1;
  }
  return { totalScore, correctCount, maxScore: getMaxScore() * results.length };
}
