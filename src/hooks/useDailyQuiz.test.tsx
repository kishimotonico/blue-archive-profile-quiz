// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { useDailyQuiz } from "./useDailyQuiz";
import type { DailyResult } from "../store/daily";

// --- モック ---

vi.mock("../quiz-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../quiz-core")>();
  return {
    ...actual,
    getDailyDate: vi.fn().mockReturnValue("2026-03-14"),
  };
});

// --- ヘルパー ---

const setupHook = (store: ReturnType<typeof createStore>) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(() => useDailyQuiz(), { wrapper });
};

const makeResultPayload = (
  studentId = "s1",
): Omit<DailyResult, "date" | "timestamp"> => ({
  score: 8,
  revealedHintCount: 3,
  studentId,
});

// --- テスト ---

describe("useDailyQuiz - saveTodayResult", () => {
  let mockGetDailyDate: ReturnType<typeof vi.mocked<() => string>>;

  beforeEach(async () => {
    localStorage.clear();
    const { getDailyDate } = await import("../quiz-core");
    mockGetDailyDate = vi.mocked(getDailyDate);
    mockGetDailyDate.mockReturnValue("2026-03-14");
  });

  it("結果が保存され、date と timestamp が自動付与される", () => {
    const store = createStore();
    const { result } = setupHook(store);

    act(() => result.current.saveTodayResult(makeResultPayload()));

    const saved = result.current.dailyResults;
    expect(saved).toHaveLength(1);
    expect(saved[0].date).toBe("2026-03-14");
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

    // 昨日の日付で保存（mockReturnValue で全呼び出しに適用）
    mockGetDailyDate.mockReturnValue("2026-03-13");
    act(() => result.current.saveTodayResult({ ...makeResultPayload("s2"), score: 6 }));

    // 今日の日付に切り替えて保存
    mockGetDailyDate.mockReturnValue("2026-03-14");
    act(() => result.current.saveTodayResult({ ...makeResultPayload("s1"), score: 8 }));

    const saved = result.current.dailyResults;
    expect(saved).toHaveLength(2);
    expect(saved.find((r) => r.date === "2026-03-13")).toBeDefined();
    expect(saved.find((r) => r.date === "2026-03-14")).toBeDefined();
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
    expect(todayResult?.date).toBe("2026-03-14");
  });

  it("本日の結果が存在しない場合は undefined を返す", () => {
    const store = createStore();
    const { result } = setupHook(store);

    const todayResult = result.current.getTodayResult();
    expect(todayResult).toBeUndefined();
  });

  it("昨日の結果のみ存在する場合は undefined を返す", () => {
    const store = createStore();
    const { result } = setupHook(store);

    // 昨日の日付で結果を保存
    mockGetDailyDate.mockReturnValue("2026-03-13");
    act(() => result.current.saveTodayResult(makeResultPayload()));

    // 今日の日付に戻して取得
    mockGetDailyDate.mockReturnValue("2026-03-14");
    expect(result.current.getTodayResult()).toBeUndefined();
  });
});

describe("useDailyQuiz - saveProgress", () => {
  beforeEach(async () => {
    localStorage.clear();
    const { getDailyDate } = await import("../quiz-core");
    vi.mocked(getDailyDate).mockReturnValue("2026-03-14");
  });

  it("保存した内容に date が自動付与される", () => {
    const store = createStore();
    const { result } = setupHook(store);

    act(() =>
      result.current.saveProgress({
        studentId: "s1",
        revealedHintCount: 2,
        hints: [{ type: "school", label: "学園", value: "テスト学園" }],
      }),
    );

    expect(result.current.dailyProgress?.date).toBe("2026-03-14");
  });

  it("dailyProgress に値がセットされる", () => {
    const store = createStore();
    const { result } = setupHook(store);

    act(() =>
      result.current.saveProgress({
        studentId: "s1",
        revealedHintCount: 3,
        hints: [],
      }),
    );

    expect(result.current.dailyProgress).not.toBeNull();
    expect(result.current.dailyProgress?.studentId).toBe("s1");
    expect(result.current.dailyProgress?.revealedHintCount).toBe(3);
  });

  it("2回保存すると最新の値で上書きされる", () => {
    const store = createStore();
    const { result } = setupHook(store);

    act(() =>
      result.current.saveProgress({ studentId: "s1", revealedHintCount: 2, hints: [] }),
    );
    act(() =>
      result.current.saveProgress({ studentId: "s1", revealedHintCount: 5, hints: [] }),
    );

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
        studentId: "s1",
        revealedHintCount: 2,
        hints: [],
      }),
    );
    expect(result.current.dailyProgress).not.toBeNull();

    act(() => result.current.clearProgress());

    expect(result.current.dailyProgress).toBeNull();
  });
});
