// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { createStore } from "jotai";
import {
  dailyResultsStorageAtom,
  recordDailyResultAtom,
  totalAttemptsAtom,
  scoreDistributionAtom,
  bestScoreAtom,
  RECENT_DAILY_RESULTS_LIMIT,
  type DailyResultsStorage,
} from "./daily";
import type { QuizKey } from "../quiz-core/key";
import type { QuestionResult } from "../quiz-core";

const makeKey = (baseDate: string): QuizKey => ({
  version: 1,
  baseDate,
  seed: Number(baseDate.replace(/-/g, "")),
});

const makeResult = (overrides: Partial<QuestionResult> = {}): QuestionResult => ({
  studentId: "s0",
  usedHintCount: 3,
  correct: true,
  userAnswer: "s0",
  score: 5,
  ...overrides,
});

describe("recordDailyResultAtom", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    localStorage.clear();
    store = createStore();
  });

  it("結果を追加すると recent に反映される", () => {
    store.set(recordDailyResultAtom, { key: makeKey("2026-01-01"), result: makeResult() });

    const storage = store.get(dailyResultsStorageAtom);
    expect(storage.recent).toHaveLength(1);
    expect(storage.recent[0].key.baseDate).toBe("2026-01-01");
    expect(storage.recent[0].result).toEqual(makeResult());
    expect(storage.recent[0].timestamp).toBeGreaterThan(0);
  });

  it("同じ baseDate の結果が既にある場合は何もしない（冪等）", () => {
    store.set(recordDailyResultAtom, {
      key: makeKey("2026-01-01"),
      result: makeResult({ score: 5 }),
    });
    store.set(recordDailyResultAtom, {
      key: makeKey("2026-01-01"),
      result: makeResult({ score: 9 }),
    });

    const storage = store.get(dailyResultsStorageAtom);
    expect(storage.recent).toHaveLength(1);
    expect(storage.recent[0].result.score).toBe(5);
  });

  it("別の baseDate の結果は両方残る", () => {
    store.set(recordDailyResultAtom, { key: makeKey("2026-01-01"), result: makeResult() });
    store.set(recordDailyResultAtom, { key: makeKey("2026-01-02"), result: makeResult() });

    const storage = store.get(dailyResultsStorageAtom);
    expect(storage.recent).toHaveLength(2);
  });

  it(`recent が ${RECENT_DAILY_RESULTS_LIMIT} 件を超えると最古の結果が aggregated に繰り越される`, () => {
    for (let i = 0; i < RECENT_DAILY_RESULTS_LIMIT; i++) {
      const month = Math.floor(i / 28) + 1;
      const day = (i % 28) + 1;
      const baseDate = `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      store.set(recordDailyResultAtom, {
        key: makeKey(baseDate),
        result: makeResult({ score: i === 0 ? 2 : 7 }),
      });
    }

    let storage = store.get(dailyResultsStorageAtom);
    expect(storage.recent).toHaveLength(RECENT_DAILY_RESULTS_LIMIT);
    expect(storage.aggregated).toEqual({});

    store.set(recordDailyResultAtom, {
      key: makeKey("2026-12-01"),
      result: makeResult({ score: 9 }),
    });

    storage = store.get(dailyResultsStorageAtom);
    expect(storage.recent).toHaveLength(RECENT_DAILY_RESULTS_LIMIT);
    // 最も古い(timestamp が最小の) score=2 の結果が aggregated に移動している
    expect(storage.aggregated).toEqual({ 2: 1 });
  });

  it("aggregated への繰り越し後も統計 atom（total/distribution/best）に反映される", () => {
    const seeded: DailyResultsStorage = {
      recent: [
        { key: makeKey("2026-02-01"), result: makeResult({ score: 4 }), timestamp: 2 },
        { key: makeKey("2026-02-02"), result: makeResult({ score: 8 }), timestamp: 3 },
      ],
      aggregated: { 10: 50 },
    };
    store.set(dailyResultsStorageAtom, seeded);

    expect(store.get(totalAttemptsAtom)).toBe(52);
    expect(store.get(bestScoreAtom)).toBe(10);
    const distribution = store.get(scoreDistributionAtom);
    expect(distribution.perfect).toBe(50);
    expect(distribution.medium).toBe(1); // score=4
    expect(distribution.veryHigh).toBe(1); // score=8
  });
});
