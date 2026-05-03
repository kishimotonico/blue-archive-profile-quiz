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

  const saveTodayResult = useCallback(
    (result: Omit<DailyResult, "timestamp">) => {
      const today = getDailyDate();
      const newResult: DailyResult = {
        ...result,
        timestamp: Date.now(),
      };

      setDailyResults((prev) => {
        const filtered = prev.filter((r) => r.key.baseDate !== today);
        return [...filtered, newResult];
      });
    },
    [setDailyResults],
  );

  const getTodayResult = useCallback(() => {
    const today = getDailyDate();
    return dailyResults.find((r) => r.key.baseDate === today);
  }, [dailyResults]);

  const discardTodayResult = useCallback(() => {
    const today = getDailyDate();
    setDailyResults((prev) => prev.filter((r) => r.key.baseDate !== today));
  }, [setDailyResults]);

  const saveProgress = useCallback(
    (progress: DailyProgress) => {
      setDailyProgress(progress);
    },
    [setDailyProgress],
  );

  const clearProgress = useCallback(() => {
    setDailyProgress(null);
  }, [setDailyProgress]);

  return {
    dailyResults,
    saveTodayResult,
    getTodayResult,
    discardTodayResult,
    dailyProgress,
    saveProgress,
    clearProgress,
  };
}
