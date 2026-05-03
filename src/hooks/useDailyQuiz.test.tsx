// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { Provider, createStore, useAtomValue } from "jotai";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { useDailyQuiz } from "./useDailyQuiz";
import {
  type DailyResult,
  type DailyProgress,
  totalAttemptsAtom,
  scoreDistributionAtom,
  bestScoreAtom,
  aggregatedScoreCountsAtom,
} from "../store/daily";
import type { QuizKey } from "../quiz-core";

vi.mock("../quiz-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../quiz-core")>();
  return {
    ...actual,
    getDailyDate: vi.fn().mockReturnValue("2026-03-14"),
  };
});

const setupHook = (store: ReturnType<typeof createStore>) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(() => useDailyQuiz(), { wrapper });
};

const setupStatsHook = (store: ReturnType<typeof createStore>) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(
    () => ({
      total: useAtomValue(totalAttemptsAtom),
      distribution: useAtomValue(scoreDistributionAtom),
      best: useAtomValue(bestScoreAtom),
      aggregated: useAtomValue(aggregatedScoreCountsAtom),
    }),
    { wrapper },
  );
};

const makeKey = (baseDate = "2026-03-14"): QuizKey => ({
  version: 1,
  baseDate,
  seed: 20260314,
});

const makeResultPayload = (baseDate = "2026-03-14"): Omit<DailyResult, "timestamp"> => ({
  key: makeKey(baseDate),
  studentId: "s1",
  score: 8,
  revealedHintCount: 3,
  correct: true,
});

describe("useDailyQuiz - saveTodayResult", () => {
  let mockGetDailyDate: ReturnType<typeof vi.mocked<() => string>>;

  beforeEach(async () => {
    localStorage.clear();
    const { getDailyDate } = await import("../quiz-core");
    mockGetDailyDate = vi.mocked(getDailyDate);
    mockGetDailyDate.mockReturnValue("2026-03-14");
  });

  it("結果が保存され、key.baseDate と timestamp が設定される", () => {
    const store = createStore();
    const { result } = setupHook(store);

    act(() => result.current.saveTodayResult(makeResultPayload()));

    const saved = result.current.recentDailyResults;
    expect(saved).toHaveLength(1);
    expect(saved[0].key.baseDate).toBe("2026-03-14");
    expect(saved[0].studentId).toBe("s1");
    expect(saved[0].timestamp).toBeGreaterThan(0);
  });

  it("同日の古い結果が削除されて新しい結果に置き換わる（重複排除）", () => {
    const store = createStore();
    const { result } = setupHook(store);

    act(() => result.current.saveTodayResult({ ...makeResultPayload(), score: 5 }));
    act(() => result.current.saveTodayResult({ ...makeResultPayload(), score: 8 }));

    const saved = result.current.recentDailyResults;
    expect(saved).toHaveLength(1);
    expect(saved[0].score).toBe(8);
  });

  it("別日の結果は削除されずに残る", () => {
    const store = createStore();
    const { result } = setupHook(store);

    mockGetDailyDate.mockReturnValue("2026-03-13");
    act(() => result.current.saveTodayResult(makeResultPayload("2026-03-13")));

    mockGetDailyDate.mockReturnValue("2026-03-14");
    act(() => result.current.saveTodayResult(makeResultPayload("2026-03-14")));

    const saved = result.current.recentDailyResults;
    expect(saved).toHaveLength(2);
    expect(saved.find((r) => r.key.baseDate === "2026-03-13")).toBeDefined();
    expect(saved.find((r) => r.key.baseDate === "2026-03-14")).toBeDefined();
  });
});

describe("useDailyQuiz - getTodayResult", () => {
  let mockGetDailyDate: ReturnType<typeof vi.mocked<() => string>>;

  beforeEach(async () => {
    localStorage.clear();
    const { getDailyDate } = await import("../quiz-core");
    mockGetDailyDate = vi.mocked(getDailyDate);
    mockGetDailyDate.mockReturnValue("2026-03-14");
  });

  it("本日の結果が存在する場合は返す", () => {
    const store = createStore();
    const { result } = setupHook(store);

    act(() => result.current.saveTodayResult(makeResultPayload()));

    const todayResult = result.current.getTodayResult();
    expect(todayResult).toBeDefined();
    expect(todayResult?.key.baseDate).toBe("2026-03-14");
  });

  it("本日の結果が存在しない場合は undefined を返す", () => {
    const store = createStore();
    const { result } = setupHook(store);

    expect(result.current.getTodayResult()).toBeUndefined();
  });

  it("昨日の結果のみ存在する場合は undefined を返す", () => {
    const store = createStore();
    const { result } = setupHook(store);

    mockGetDailyDate.mockReturnValue("2026-03-13");
    act(() => result.current.saveTodayResult(makeResultPayload("2026-03-13")));

    mockGetDailyDate.mockReturnValue("2026-03-14");
    expect(result.current.getTodayResult()).toBeUndefined();
  });
});

describe("useDailyQuiz - discardTodayResult", () => {
  beforeEach(async () => {
    localStorage.clear();
    const { getDailyDate } = await import("../quiz-core");
    vi.mocked(getDailyDate).mockReturnValue("2026-03-14");
  });

  it("今日の結果を削除する", () => {
    const store = createStore();
    const { result } = setupHook(store);

    act(() => result.current.saveTodayResult(makeResultPayload()));
    expect(result.current.recentDailyResults).toHaveLength(1);

    act(() => result.current.discardTodayResult());
    expect(result.current.recentDailyResults).toHaveLength(0);
  });
});

describe("useDailyQuiz - saveProgress", () => {
  beforeEach(async () => {
    localStorage.clear();
    const { getDailyDate } = await import("../quiz-core");
    vi.mocked(getDailyDate).mockReturnValue("2026-03-14");
  });

  const makeProgress = (baseDate = "2026-03-14"): DailyProgress => ({
    key: makeKey(baseDate),
    revealedHintCount: 2,
  });

  it("dailyProgress に値がセットされる", () => {
    const store = createStore();
    const { result } = setupHook(store);

    act(() => result.current.saveProgress(makeProgress()));

    expect(result.current.dailyProgress).not.toBeNull();
    expect(result.current.dailyProgress?.key.baseDate).toBe("2026-03-14");
    expect(result.current.dailyProgress?.revealedHintCount).toBe(2);
  });

  it("2回保存すると最新の値で上書きされる", () => {
    const store = createStore();
    const { result } = setupHook(store);

    act(() => result.current.saveProgress({ ...makeProgress(), revealedHintCount: 2 }));
    act(() => result.current.saveProgress({ ...makeProgress(), revealedHintCount: 5 }));

    expect(result.current.dailyProgress?.revealedHintCount).toBe(5);
  });
});

describe("useDailyQuiz - clearProgress", () => {
  beforeEach(async () => {
    localStorage.clear();
    const { getDailyDate } = await import("../quiz-core");
    vi.mocked(getDailyDate).mockReturnValue("2026-03-14");
  });

  it("dailyProgress が null になる", () => {
    const store = createStore();
    const { result } = setupHook(store);

    act(() =>
      result.current.saveProgress({
        key: makeKey(),
        revealedHintCount: 2,
      }),
    );
    expect(result.current.dailyProgress).not.toBeNull();

    act(() => result.current.clearProgress());
    expect(result.current.dailyProgress).toBeNull();
  });
});

describe("useDailyQuiz - 100件超過時の集約", () => {
  let mockGetDailyDate: ReturnType<typeof vi.mocked<() => string>>;

  beforeEach(async () => {
    localStorage.clear();
    const { getDailyDate } = await import("../quiz-core");
    mockGetDailyDate = vi.mocked(getDailyDate);
  });

  /**
   * baseDate を日ごとにずらしながら N 件の結果を保存する。
   * timestamp は Date.now() に依存するので、それぞれを別 act で呼んで自然に増加させる。
   */
  const saveNDistinctResults = (
    result: ReturnType<typeof setupHook>["result"],
    n: number,
    score: (i: number) => number = () => 5,
  ) => {
    for (let i = 0; i < n; i++) {
      // 日付重複が起きないよう月もずらす（28日 x 12ヶ月 = 336件まで対応）
      const month = Math.floor(i / 28) + 1;
      const day = (i % 28) + 1;
      const dateStr = `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      mockGetDailyDate.mockReturnValue(dateStr);
      act(() =>
        result.current.saveTodayResult({
          key: { ...makeKey(dateStr), baseDate: dateStr },
          studentId: `s${i}`,
          score: score(i),
          revealedHintCount: 3,
          correct: true,
        }),
      );
    }
  };

  it("100件保存後にさらに保存すると、最古が aggregated に移動する", () => {
    const store = createStore();
    const { result } = setupHook(store);
    const stats = setupStatsHook(store);

    saveNDistinctResults(result, 100, (i) => (i === 0 ? 2 : 7));

    expect(result.current.recentDailyResults).toHaveLength(100);
    expect(stats.result.current.aggregated).toEqual({});

    // 101件目を保存
    mockGetDailyDate.mockReturnValue("2026-12-01");
    act(() =>
      result.current.saveTodayResult({
        key: { ...makeKey("2026-12-01"), baseDate: "2026-12-01" },
        studentId: "s100",
        score: 9,
        revealedHintCount: 2,
        correct: true,
      }),
    );

    // recent は 100 件のまま
    expect(result.current.recentDailyResults).toHaveLength(100);
    // 最古(score=2)が aggregated に集約されているはず
    expect(stats.result.current.aggregated).toEqual({ 2: 1 });
    // recent に最古(s0)は残らない
    expect(
      result.current.recentDailyResults.find((r) => r.studentId === "s0"),
    ).toBeUndefined();
  });

  it("100件超えても recent.length は 100 を保つ", () => {
    const store = createStore();
    const { result } = setupHook(store);

    saveNDistinctResults(result, 150, () => 5);

    expect(result.current.recentDailyResults).toHaveLength(100);
  });

  it("aggregated に集約された結果が totalAttemptsAtom / scoreDistributionAtom / bestScoreAtom に反映される", () => {
    const store = createStore();
    const { result } = setupHook(store);
    const stats = setupStatsHook(store);

    // 150 件: 最初の 50 件は溢れて aggregated に入る（timestamp が最も古いため）
    // score を分散させる: 最初の 50件は score=10, 残りの 100件は score=4
    saveNDistinctResults(result, 150, (i) => (i < 50 ? 10 : 4));

    // total = recent (100) + aggregated (50) = 150
    expect(stats.result.current.total).toBe(150);

    // 最古50件 (score=10) が aggregated に行き、recent には score=4 が 100件残る
    expect(stats.result.current.aggregated).toEqual({ 10: 50 });

    // bestScore は aggregated の 10 が反映される
    expect(stats.result.current.best).toBe(10);

    // 分布: perfect=50 (aggregated由来), medium=100 (recent由来)
    expect(stats.result.current.distribution.perfect).toBe(50);
    expect(stats.result.current.distribution.medium).toBe(100);
    expect(stats.result.current.distribution.zero).toBe(0);
    expect(stats.result.current.distribution.low).toBe(0);
    expect(stats.result.current.distribution.high).toBe(0);
    expect(stats.result.current.distribution.veryHigh).toBe(0);
  });
});
