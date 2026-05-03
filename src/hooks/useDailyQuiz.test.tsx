// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { useDailyQuiz } from "./useDailyQuiz";
import type { DailyResult, DailyProgress } from "../store/daily";
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

    const saved = result.current.dailyResults;
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

    const saved = result.current.dailyResults;
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

    const saved = result.current.dailyResults;
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
    expect(result.current.dailyResults).toHaveLength(1);

    act(() => result.current.discardTodayResult());
    expect(result.current.dailyResults).toHaveLength(0);
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
