import { useAtom, useSetAtom } from "jotai";
import { useCallback } from "react";
import {
  dailyResultsStorageAtom,
  dailyProgressAtom,
  recordDailyResultAtom,
  type DailyProgress,
} from "../store/daily";
import type { QuizKey, QuestionResult } from "../quiz-core";

// 中身は次のタスク（controller 化）で作り直す。ここでは store/daily.ts の
// 形の変更に追従するための最小限の実装だけを置く。
export function useDailyQuiz() {
  const [dailyResultsStorage] = useAtom(dailyResultsStorageAtom);
  const [dailyProgress, setDailyProgress] = useAtom(dailyProgressAtom);
  const recordDailyResult = useSetAtom(recordDailyResultAtom);

  const saveTodayResult = useCallback(
    (key: QuizKey, result: QuestionResult) => {
      recordDailyResult({ key, result });
    },
    [recordDailyResult],
  );

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
    /**
     * 直近 RECENT_DAILY_RESULTS_LIMIT(=100) 件の結果のみを返す。
     * 長期累計は scoreDistributionAtom / totalAttemptsAtom / bestScoreAtom を参照すること。
     */
    recentDailyResults: dailyResultsStorage.recent,
    saveTodayResult,
    dailyProgress,
    saveProgress,
    clearProgress,
  };
}
