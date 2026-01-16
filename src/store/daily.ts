import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

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
