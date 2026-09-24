import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { QuizKey } from "../quiz-core/key";
import type { QuestionResult } from "../quiz-core";

export interface DailyResult {
  key: QuizKey;
  result: QuestionResult; // フリープレイと同じ確定結果（userAnswer・usedHintCount を含む）
  timestamp: number;
}

export interface DailyProgress {
  key: QuizKey;
  revealedHintCount: number;
  // hints[] は保存しない。key から完全再生成可能
}

/**
 * localStorage に永続化する日替わりクイズ結果のスキーマ。
 * - recent: 直近100件の詳細結果（重複排除や復元に必要）
 * - aggregated: 100件を超えた古い結果を score(0〜10) → 件数 に集約したもの
 *
 * 詳細を全件持ち続けると localStorage が肥大化するため、
 * 古い結果はスコア帯統計のみ保持する。
 */
export interface DailyResultsStorage {
  recent: DailyResult[];
  aggregated: Record<number, number>;
}

export const RECENT_DAILY_RESULTS_LIMIT = 100;

// v2・v3 のキーは localStorage から消さない。次のタスク（読み込み・検証・移行）で移行元として使うため。
export const STORAGE_KEY_DAILY_RESULTS = "blue-archive-quiz-daily-results-v4";

const initialDailyResultsStorage: DailyResultsStorage = {
  recent: [],
  aggregated: {},
};

// getOnInit: true により atom 初期化時に同期的に localStorage から値を読み込む。
// controller が store.get() で永続化値を読むため、onMount による hydration を
// 待たず確実に値を取得できるようにしている。
export const dailyResultsStorageAtom = atomWithStorage<DailyResultsStorage>(
  STORAGE_KEY_DAILY_RESULTS,
  initialDailyResultsStorage,
  undefined,
  { getOnInit: true },
);

export const dailyProgressAtom = atomWithStorage<DailyProgress | null>(
  "blue-archive-quiz-daily-progress-v2",
  null,
  undefined,
  { getOnInit: true },
);

/** recent（直近100件）を取り出す派生 atom。テスト等での参照用。 */
export const recentDailyResultsAtom = atom((get) => get(dailyResultsStorageAtom).recent);

/** aggregated（古い結果のスコア帯別件数）を取り出す派生 atom。 */
export const aggregatedScoreCountsAtom = atom((get) => get(dailyResultsStorageAtom).aggregated);

export const totalAttemptsAtom = atom((get) => {
  const { recent, aggregated } = get(dailyResultsStorageAtom);
  const aggregatedTotal = Object.values(aggregated).reduce((sum, c) => sum + c, 0);
  return recent.length + aggregatedTotal;
});

export const scoreDistributionAtom = atom((get) => {
  const { recent, aggregated } = get(dailyResultsStorageAtom);

  const countAggregated = (predicate: (score: number) => boolean) =>
    Object.entries(aggregated).reduce((sum, [scoreStr, count]) => {
      const score = Number(scoreStr);
      return predicate(score) ? sum + count : sum;
    }, 0);

  return {
    zero: recent.filter((r) => r.result.score === 0).length + countAggregated((s) => s === 0),
    low:
      recent.filter((r) => r.result.score >= 1 && r.result.score <= 3).length +
      countAggregated((s) => s >= 1 && s <= 3),
    medium:
      recent.filter((r) => r.result.score >= 4 && r.result.score <= 5).length +
      countAggregated((s) => s >= 4 && s <= 5),
    high:
      recent.filter((r) => r.result.score >= 6 && r.result.score <= 7).length +
      countAggregated((s) => s >= 6 && s <= 7),
    veryHigh:
      recent.filter((r) => r.result.score >= 8 && r.result.score <= 9).length +
      countAggregated((s) => s >= 8 && s <= 9),
    perfect:
      recent.filter((r) => r.result.score === 10).length + countAggregated((s) => s === 10),
  };
});

export const bestScoreAtom = atom((get) => {
  const { recent, aggregated } = get(dailyResultsStorageAtom);
  const recentMax = recent.reduce((max, r) => (r.result.score > max ? r.result.score : max), 0);
  const aggregatedScores = Object.keys(aggregated)
    .map((s) => Number(s))
    .filter((s) => (aggregated[s] ?? 0) > 0);
  const aggregatedMax = aggregatedScores.reduce((max, s) => (s > max ? s : max), 0);
  return Math.max(recentMax, aggregatedMax);
});

/**
 * 直近の結果配列に新しい結果を追加し、上限を超えた最古の結果を aggregated に移す。
 * 「最古」は timestamp の最小値で判定する。
 */
function applyOverflowToAggregated(storage: DailyResultsStorage): DailyResultsStorage {
  if (storage.recent.length <= RECENT_DAILY_RESULTS_LIMIT) {
    return storage;
  }

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
    [oldest.result.score]: (storage.aggregated[oldest.result.score] ?? 0) + 1,
  };

  return { recent: nextRecent, aggregated: nextAggregated };
}

/**
 * 日替わりクイズの結果を記録する write-only atom。
 * 同じ baseDate の結果が既にあれば何もしない（再訪時の二重記録を防ぐため冪等にする）。
 */
export const recordDailyResultAtom = atom(
  null,
  (get, set, { key, result }: { key: QuizKey; result: QuestionResult }) => {
    const storage = get(dailyResultsStorageAtom);
    if (storage.recent.some((r) => r.key.baseDate === key.baseDate)) return;

    const newResult: DailyResult = { key, result, timestamp: Date.now() };
    const next: DailyResultsStorage = {
      recent: [...storage.recent, newResult],
      aggregated: storage.aggregated,
    };
    set(dailyResultsStorageAtom, applyOverflowToAggregated(next));
  },
);
