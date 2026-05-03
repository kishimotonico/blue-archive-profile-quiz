import { useAtom } from "jotai";
import { useCallback } from "react";
import {
  dailyResultsStorageAtom,
  dailyProgressAtom,
  RECENT_DAILY_RESULTS_LIMIT,
  type DailyResult,
  type DailyResultsStorage,
  type DailyProgress,
} from "../store/daily";
import { getDailyDate } from "../quiz-core";

/**
 * 直近の結果配列に新しい結果を追加し、上限を超えた最古の結果を aggregated に移す。
 * 「最古」は timestamp の最小値で判定する。
 */
function applyOverflowToAggregated(
  storage: DailyResultsStorage,
): DailyResultsStorage {
  if (storage.recent.length <= RECENT_DAILY_RESULTS_LIMIT) {
    return storage;
  }

  // 最古（最小 timestamp）のインデックスを探す
  let oldestIdx = 0;
  for (let i = 1; i < storage.recent.length; i++) {
    if (storage.recent[i].timestamp < storage.recent[oldestIdx].timestamp) {
      oldestIdx = i;
    }
  }

  const oldest = storage.recent[oldestIdx];
  const nextRecent = storage.recent.filter((_, i) => i !== oldestIdx);
  const nextAggregated: Record<number, number> = {
    ...storage.aggregated,
    [oldest.score]: (storage.aggregated[oldest.score] ?? 0) + 1,
  };

  return { recent: nextRecent, aggregated: nextAggregated };
}

export function useDailyQuiz() {
  const [dailyResultsStorage, setDailyResultsStorage] = useAtom(dailyResultsStorageAtom);
  const [dailyProgress, setDailyProgress] = useAtom(dailyProgressAtom);

  const saveTodayResult = useCallback(
    (result: Omit<DailyResult, "timestamp">) => {
      const today = getDailyDate();
      const newResult: DailyResult = {
        ...result,
        timestamp: Date.now(),
      };

      setDailyResultsStorage((prev) => {
        // 同日重複排除は recent からのみ行う
        // (aggregated には日付情報がなく、過去の同日データが集約済みのケースは無視する)
        const filteredRecent = prev.recent.filter((r) => r.key.baseDate !== today);
        const next: DailyResultsStorage = {
          recent: [...filteredRecent, newResult],
          aggregated: prev.aggregated,
        };
        return applyOverflowToAggregated(next);
      });
    },
    [setDailyResultsStorage],
  );

  const getTodayResult = useCallback(() => {
    const today = getDailyDate();
    return dailyResultsStorage.recent.find((r) => r.key.baseDate === today);
  }, [dailyResultsStorage]);

  const discardTodayResult = useCallback(() => {
    const today = getDailyDate();
    setDailyResultsStorage((prev) => ({
      recent: prev.recent.filter((r) => r.key.baseDate !== today),
      aggregated: prev.aggregated,
    }));
  }, [setDailyResultsStorage]);

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
    getTodayResult,
    discardTodayResult,
    dailyProgress,
    saveProgress,
    clearProgress,
  };
}
