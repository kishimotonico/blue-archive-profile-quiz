import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { QuizKey } from "../quiz-core/key";

export interface DailyResult {
  key: QuizKey;
  studentId: string; // リプレイ時の整合性チェック用
  score: number;
  revealedHintCount: number;
  correct: boolean;
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

export const STORAGE_KEY_DAILY_RESULTS_V2 = "blue-archive-quiz-daily-results-v2";
export const STORAGE_KEY_DAILY_RESULTS_V3 = "blue-archive-quiz-daily-results-v3";

const initialDailyResultsStorage: DailyResultsStorage = {
  recent: [],
  aggregated: {},
};

/**
 * v2 (DailyResult[]) → v3 (DailyResultsStorage) のマイグレーションを実行する。
 *
 * - v3 が既に存在する場合は何もしない（v2 で上書きしない）
 * - v2 が存在しない場合は何もしない
 * - v2 を timestamp 降順で並べ、上位 RECENT_DAILY_RESULTS_LIMIT 件を recent に、
 *   残りを aggregated（score → count）に集約する
 * - 完了後、v2 は削除する（ロールバック不要、ストレージ節約優先）
 *
 * モジュール読み込み時に IIFE で同期実行される（現実のユーザー環境向け）。
 */
export function migrateDailyResultsV2ToV3(): void {
  if (typeof localStorage === "undefined") return;

  // v3 が既にあれば何もしない
  if (localStorage.getItem(STORAGE_KEY_DAILY_RESULTS_V3) !== null) return;

  const v2Raw = localStorage.getItem(STORAGE_KEY_DAILY_RESULTS_V2);
  if (v2Raw === null) return;

  let v2Data: unknown;
  try {
    v2Data = JSON.parse(v2Raw);
  } catch {
    // パース失敗時はマイグレーションを諦め、v2 はそのまま残す（次回試行可能）
    return;
  }

  if (!Array.isArray(v2Data)) return;

  // 型チェックは緩めに：DailyResult っぽい構造のものだけ拾う
  const results = v2Data.filter(
    (r): r is DailyResult =>
      r !== null &&
      typeof r === "object" &&
      typeof (r as DailyResult).timestamp === "number" &&
      typeof (r as DailyResult).score === "number",
  );

  // timestamp 降順
  const sorted = [...results].sort((a, b) => b.timestamp - a.timestamp);

  const recent = sorted.slice(0, RECENT_DAILY_RESULTS_LIMIT);
  const overflow = sorted.slice(RECENT_DAILY_RESULTS_LIMIT);

  const aggregated: Record<number, number> = {};
  for (const r of overflow) {
    aggregated[r.score] = (aggregated[r.score] ?? 0) + 1;
  }

  const v3: DailyResultsStorage = { recent, aggregated };

  localStorage.setItem(STORAGE_KEY_DAILY_RESULTS_V3, JSON.stringify(v3));
  localStorage.removeItem(STORAGE_KEY_DAILY_RESULTS_V2);
}

// モジュール読み込み時に同期的にマイグレーション実行
migrateDailyResultsV2ToV3();

// getOnInit: true により atom 初期化時に同期的に localStorage から値を読み込む。
// これがないと初回 render で初期値（空 / null）が返り、useEffect 内の closure に
// 古い値がキャプチャされて再読み込み時の状態復元が壊れる（DailyQuiz.tsx の初期化
// useEffect は loading ガードで 1 回しか走らないため、後からの hydration が反映
// されない）。
// getOnInit: true により atom 初期化時に同期的に localStorage から値を読み込む。
// DailyQuiz.tsx の初期化 useEffect は store.get() で永続化値を読むため、
// onMount による hydration を待たず確実に値を取得できるようにしている。
export const dailyResultsStorageAtom = atomWithStorage<DailyResultsStorage>(
  STORAGE_KEY_DAILY_RESULTS_V3,
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
export const recentDailyResultsAtom = atom(
  (get) => get(dailyResultsStorageAtom).recent,
);

/** aggregated（古い結果のスコア帯別件数）を取り出す派生 atom。 */
export const aggregatedScoreCountsAtom = atom(
  (get) => get(dailyResultsStorageAtom).aggregated,
);

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
    zero:
      recent.filter((r) => r.score === 0).length + countAggregated((s) => s === 0),
    low:
      recent.filter((r) => r.score >= 1 && r.score <= 3).length +
      countAggregated((s) => s >= 1 && s <= 3),
    medium:
      recent.filter((r) => r.score >= 4 && r.score <= 5).length +
      countAggregated((s) => s >= 4 && s <= 5),
    high:
      recent.filter((r) => r.score >= 6 && r.score <= 7).length +
      countAggregated((s) => s >= 6 && s <= 7),
    veryHigh:
      recent.filter((r) => r.score >= 8 && r.score <= 9).length +
      countAggregated((s) => s >= 8 && s <= 9),
    perfect:
      recent.filter((r) => r.score === 10).length + countAggregated((s) => s === 10),
  };
});

export const bestScoreAtom = atom((get) => {
  const { recent, aggregated } = get(dailyResultsStorageAtom);
  const recentMax = recent.reduce((max, r) => (r.score > max ? r.score : max), 0);
  const aggregatedScores = Object.keys(aggregated)
    .map((s) => Number(s))
    .filter((s) => (aggregated[s] ?? 0) > 0);
  const aggregatedMax = aggregatedScores.reduce((max, s) => (s > max ? s : max), 0);
  return Math.max(recentMax, aggregatedMax);
});
