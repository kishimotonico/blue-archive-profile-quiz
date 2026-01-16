import { useAtom } from 'jotai';
import { useCallback } from 'react';
import {
  dailyResultsAtom,
  isTodayCompletedAtom,
  type DailyResult,
} from '../store/daily';
import { getDailyDate } from '../quiz-core';

export function useDailyQuiz() {
  const [dailyResults, setDailyResults] = useAtom(dailyResultsAtom);
  const [isTodayCompleted] = useAtom(isTodayCompletedAtom);

  /**
   * 今日の結果を保存
   */
  const saveTodayResult = useCallback(
    (result: Omit<DailyResult, 'date' | 'timestamp'>) => {
      const today = getDailyDate();
      const newResult: DailyResult = {
        ...result,
        date: today,
        timestamp: Date.now(),
      };

      setDailyResults((prev) => {
        // 既存の今日の結果を削除
        const filtered = prev.filter((r) => r.date !== today);
        return [...filtered, newResult];
      });
    },
    [setDailyResults]
  );

  /**
   * 今日の結果を取得
   */
  const getTodayResult = useCallback(() => {
    const today = getDailyDate();
    return dailyResults.find((r) => r.date === today);
  }, [dailyResults]);

  /**
   * 全結果をクリア
   */
  const clearAllResults = useCallback(() => {
    setDailyResults([]);
  }, [setDailyResults]);

  return {
    dailyResults,
    isTodayCompleted,
    saveTodayResult,
    getTodayResult,
    clearAllResults,
  };
}
