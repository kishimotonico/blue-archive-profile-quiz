import { useAtom } from "jotai";
import { useCallback } from "react";
import {
  dailyResultsAtom,
  dailyProgressAtom,
  type DailyResult,
  type DailyProgress,
} from "../store/daily";
import { getDailyDate } from "../quiz-core";

export function useDailyQuiz() {
  const [dailyResults, setDailyResults] = useAtom(dailyResultsAtom);
  const [dailyProgress, setDailyProgress] = useAtom(dailyProgressAtom);

  /**
   * 今日の結果を保存
   */
  const saveTodayResult = useCallback(
    (result: Omit<DailyResult, "date" | "timestamp">) => {
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
    [setDailyResults],
  );

  /**
   * 今日の結果を取得
   */
  const getTodayResult = useCallback(() => {
    const today = getDailyDate();
    return dailyResults.find((r) => r.date === today);
  }, [dailyResults]);

  /**
   * 進行状態を保存
   */
  const saveProgress = useCallback(
    (progress: Omit<DailyProgress, "date">) => {
      const today = getDailyDate();
      setDailyProgress({
        ...progress,
        date: today,
      });
    },
    [setDailyProgress],
  );

  /**
   * 進行状態をクリア
   */
  const clearProgress = useCallback(() => {
    setDailyProgress(null);
  }, [setDailyProgress]);

  return {
    dailyResults,
    saveTodayResult,
    getTodayResult,
    dailyProgress,
    saveProgress,
    clearProgress,
  };
}
