// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  migrateDailyResultsV2ToV3,
  STORAGE_KEY_DAILY_RESULTS_V2,
  STORAGE_KEY_DAILY_RESULTS_V3,
  RECENT_DAILY_RESULTS_LIMIT,
  type DailyResult,
  type DailyResultsStorage,
} from "./daily";
import type { QuizKey } from "../quiz-core/key";

const makeKey = (baseDate: string): QuizKey => ({
  version: 1,
  baseDate,
  seed: Number(baseDate.replace(/-/g, "")),
});

const makeResult = (overrides: Partial<DailyResult> = {}): DailyResult => ({
  key: makeKey("2026-01-01"),
  studentId: "s0",
  score: 5,
  revealedHintCount: 3,
  correct: true,
  timestamp: 1_700_000_000_000,
  ...overrides,
});

describe("migrateDailyResultsV2ToV3", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("v2 が存在し v3 が無い場合: v3 を作って v2 を削除する", () => {
    const v2: DailyResult[] = [
      makeResult({ studentId: "a", score: 5, timestamp: 1000 }),
      makeResult({ studentId: "b", score: 8, timestamp: 2000 }),
    ];
    localStorage.setItem(STORAGE_KEY_DAILY_RESULTS_V2, JSON.stringify(v2));

    migrateDailyResultsV2ToV3();

    expect(localStorage.getItem(STORAGE_KEY_DAILY_RESULTS_V2)).toBeNull();
    const v3Raw = localStorage.getItem(STORAGE_KEY_DAILY_RESULTS_V3);
    expect(v3Raw).not.toBeNull();
    const v3 = JSON.parse(v3Raw!) as DailyResultsStorage;
    expect(v3.recent).toHaveLength(2);
    // timestamp 降順
    expect(v3.recent[0].studentId).toBe("b");
    expect(v3.recent[1].studentId).toBe("a");
    expect(v3.aggregated).toEqual({});
  });

  it("200件のデータがある場合: recent 100件 + aggregated に100件分集約される", () => {
    // 200件: timestamp は 1〜200 で、score は i % 11（0〜10 を循環）
    const v2: DailyResult[] = [];
    for (let i = 1; i <= 200; i++) {
      v2.push(
        makeResult({
          studentId: `s${i}`,
          score: i % 11,
          timestamp: i,
        }),
      );
    }
    localStorage.setItem(STORAGE_KEY_DAILY_RESULTS_V2, JSON.stringify(v2));

    migrateDailyResultsV2ToV3();

    const v3 = JSON.parse(
      localStorage.getItem(STORAGE_KEY_DAILY_RESULTS_V3)!,
    ) as DailyResultsStorage;

    expect(v3.recent).toHaveLength(RECENT_DAILY_RESULTS_LIMIT);

    // 最も新しい timestamp=200 から 101 までが recent (100件)
    // timestamp 1〜100 までが aggregated に集約 (100件)
    const aggregatedTotal = Object.values(v3.aggregated).reduce(
      (sum, c) => sum + c,
      0,
    );
    expect(aggregatedTotal).toBe(100);

    // recent の最も古い timestamp は 101
    const minTsInRecent = Math.min(...v3.recent.map((r) => r.timestamp));
    expect(minTsInRecent).toBe(101);

    // aggregated の集計を検証: timestamp 1〜100 のスコア (i % 11) のヒストグラム
    const expectedAggregated: Record<number, number> = {};
    for (let i = 1; i <= 100; i++) {
      const s = i % 11;
      expectedAggregated[s] = (expectedAggregated[s] ?? 0) + 1;
    }
    // JSON.parse で整数キーが文字列化されるので、片方を文字列キーに合わせて比較
    const normalize = (obj: Record<string | number, number>) =>
      Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [String(k), v]),
      );
    expect(normalize(v3.aggregated)).toEqual(normalize(expectedAggregated));

    // v2 は削除されている
    expect(localStorage.getItem(STORAGE_KEY_DAILY_RESULTS_V2)).toBeNull();
  });

  it("v3 が既にある場合は v2 を上書きしない", () => {
    const existingV3: DailyResultsStorage = {
      recent: [makeResult({ studentId: "existing", score: 7, timestamp: 9999 })],
      aggregated: { 3: 5 },
    };
    localStorage.setItem(
      STORAGE_KEY_DAILY_RESULTS_V3,
      JSON.stringify(existingV3),
    );

    const v2: DailyResult[] = [
      makeResult({ studentId: "v2only", score: 0, timestamp: 1 }),
    ];
    localStorage.setItem(STORAGE_KEY_DAILY_RESULTS_V2, JSON.stringify(v2));

    migrateDailyResultsV2ToV3();

    // v3 はそのまま
    const v3 = JSON.parse(
      localStorage.getItem(STORAGE_KEY_DAILY_RESULTS_V3)!,
    ) as DailyResultsStorage;
    expect(v3).toEqual(existingV3);

    // v2 はそのまま残る（v3 が既にあるなら触らない）
    expect(localStorage.getItem(STORAGE_KEY_DAILY_RESULTS_V2)).not.toBeNull();
  });

  it("v2 が存在しない場合は何もしない", () => {
    expect(localStorage.getItem(STORAGE_KEY_DAILY_RESULTS_V2)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY_DAILY_RESULTS_V3)).toBeNull();

    migrateDailyResultsV2ToV3();

    expect(localStorage.getItem(STORAGE_KEY_DAILY_RESULTS_V2)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY_DAILY_RESULTS_V3)).toBeNull();
  });

  it("v2 のデータが不正な JSON でも例外を投げない", () => {
    localStorage.setItem(STORAGE_KEY_DAILY_RESULTS_V2, "not-json");

    expect(() => migrateDailyResultsV2ToV3()).not.toThrow();

    // v3 は作られない（パース失敗時は何もしない）
    expect(localStorage.getItem(STORAGE_KEY_DAILY_RESULTS_V3)).toBeNull();
  });
});
