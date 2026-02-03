import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { Hint } from '../quiz-core/types';

/**
 * 日替わりクイズの結果を保存する型
 */
export interface DailyResult {
  date: string;
  score: number;
  revealedHintCount: number;
  studentId: string;
  timestamp: number;
}

/**
 * 日替わりクイズの進行状態を保存する型
 */
export interface DailyProgress {
  date: string;
  studentId: string;
  revealedHintCount: number;
  hints: Hint[];  // シャッフル順を復元用
}

/**
 * 日替わりクイズの結果履歴（ローカルストレージに永続化）
 */
export const dailyResultsAtom = atomWithStorage<DailyResult[]>(
  'blue-archive-quiz-daily-results',
  []
);

/**
 * 今日の日替わりクイズが完了済みかどうか
 */
export const isTodayCompletedAtom = atom((get) => {
  const results = get(dailyResultsAtom);
  const today = new Date().toISOString().split('T')[0];
  return results.some((r) => r.date === today);
});

/**
 * 合計スコアを取得
 */
export const totalScoreAtom = atom((get) => {
  const results = get(dailyResultsAtom);
  return results.reduce((sum, r) => sum + r.score, 0);
});

/**
 * 平均スコアを取得
 */
export const averageScoreAtom = atom((get) => {
  const results = get(dailyResultsAtom);
  if (results.length === 0) return 0;
  return get(totalScoreAtom) / results.length;
});

/**
 * 日替わりクイズの進行状態（ローカルストレージに永続化）
 */
export const dailyProgressAtom = atomWithStorage<DailyProgress | null>(
  'blue-archive-quiz-daily-progress',
  null
);

/**
 * 累積挑戦回数
 */
export const totalAttemptsAtom = atom((get) => get(dailyResultsAtom).length);

/**
 * スコア分布（10点満点システム）
 */
export const scoreDistributionAtom = atom((get) => {
  const results = get(dailyResultsAtom);
  return {
    zero: results.filter(r => r.score === 0).length,
    low: results.filter(r => r.score >= 1 && r.score <= 3).length,
    medium: results.filter(r => r.score >= 4 && r.score <= 5).length,
    high: results.filter(r => r.score >= 6 && r.score <= 7).length,
    veryHigh: results.filter(r => r.score >= 8 && r.score <= 9).length,
    perfect: results.filter(r => r.score === 10).length,
  };
});

/**
 * ベストスコア
 */
export const bestScoreAtom = atom((get) =>
  Math.max(0, ...get(dailyResultsAtom).map(r => r.score))
);
