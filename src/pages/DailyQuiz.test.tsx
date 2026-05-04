// @vitest-environment jsdom
import { render, screen, waitFor, act } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { BrowserRouter } from "react-router-dom";
import { Suspense } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DailyQuiz from "./DailyQuiz";
import type { DailyResultsStorage, DailyProgress } from "../store/daily";
import {
  STORAGE_KEY_DAILY_RESULTS_V3,
} from "../store/daily";

const DAILY_PROGRESS_KEY = "blue-archive-quiz-daily-progress-v2";

const { mockStudent, mockQuestion } = vi.hoisted(() => {
  const student = {
    id: "s1",
    fullName: "テスト 太郎",
    name: "タロウ",
    school: "テスト学園",
    grade: "1年生",
    club: "テスト部",
    age: "15歳",
    birthday: "1月1日",
    height: "160cm",
    hobby: "テスト",
    weaponName: "テスト銃",
    cv: "テストCV",
    portraitImage: "images/s1.png",
    availableFrom: "2026-04-21",
    skills: { ex: "", normal: "", passive: "", sub: "" },
  };
  const question = {
    student,
    hints: [
      { type: "school", label: "学園", value: "VAL_HINT_1" },
      { type: "club", label: "部活", value: "VAL_HINT_2" },
      { type: "age", label: "年齢", value: "VAL_HINT_3" },
      { type: "birthday", label: "誕生日", value: "VAL_HINT_4" },
      { type: "height", label: "身長", value: "VAL_HINT_5" },
      { type: "hobby", label: "趣味", value: "VAL_HINT_6" },
      { type: "weaponName", label: "武器", value: "VAL_HINT_7" },
      { type: "cv", label: "CV", value: "VAL_HINT_8" },
      { type: "familyName", label: "姓", value: "VAL_HINT_9" },
    ],
    key: { version: 1, baseDate: "2026-04-21", seed: 20260421 },
  };
  return { mockStudent: student, mockQuestion: question };
});

vi.mock("../quiz-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../quiz-core")>();
  return {
    ...actual,
    loadStudents: vi.fn().mockResolvedValue([mockStudent]),
    getDailyDate: vi.fn().mockReturnValue("2026-04-21"),
    createDailyQuestion: vi.fn().mockResolvedValue(mockQuestion),
    createQuestion: vi.fn().mockResolvedValue(mockQuestion),
  };
});

vi.mock("../components/quiz/portraitImageUrl", () => ({
  preloadPortraitImage: vi.fn(),
  getPortraitImageUrl: vi.fn().mockReturnValue("about:blank"),
  NO_IMAGE_URL: "about:blank",
}));

const renderDailyQuiz = async () => {
  const store = createStore();
  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <BrowserRouter>
        <Provider store={store}>
          <Suspense fallback={<div data-testid="suspense-fallback">loading</div>}>
            <DailyQuiz />
          </Suspense>
        </Provider>
      </BrowserRouter>,
    );
  });
  return result!;
};

const PROGRESS_KEY = { version: 1, baseDate: "2026-04-21", seed: 20260421 };

describe("DailyQuiz - 再マウント時の状態復元", () => {
  beforeEach(async () => {
    localStorage.clear();
    const { createDailyQuestion, createQuestion } = await import("../quiz-core");
    vi.mocked(createDailyQuestion).mockClear();
    vi.mocked(createQuestion).mockClear();
  });

  it("localStorage に dailyProgress があると revealedHintCount が復元される", async () => {
    const progress: DailyProgress = { key: PROGRESS_KEY, revealedHintCount: 3 };
    localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(progress));

    await renderDailyQuiz();

    // 3つ目の hint まで開示されている（VAL_HINT_3 まで表示、VAL_HINT_4 はまだ "???"）
    await waitFor(() => {
      expect(screen.queryAllByText("VAL_HINT_3").length).toBeGreaterThan(0);
    });
    expect(screen.queryAllByText("VAL_HINT_4").length).toBe(0);

    // 初期化フローは復元路だけを通り、新規プレイ路の createDailyQuestion は呼ばれないこと
    const { createDailyQuestion, createQuestion } = await import("../quiz-core");
    expect(vi.mocked(createDailyQuestion)).not.toHaveBeenCalled();
    expect(vi.mocked(createQuestion)).toHaveBeenCalledTimes(1);
  });

  it("localStorage に今日の dailyResult があると完了済み画面が表示される", async () => {
    const storage: DailyResultsStorage = {
      recent: [
        {
          key: PROGRESS_KEY,
          studentId: "s1",
          score: 8,
          revealedHintCount: 3,
          correct: true,
          timestamp: 1234567890,
        },
      ],
      aggregated: {},
    };
    localStorage.setItem(STORAGE_KEY_DAILY_RESULTS_V3, JSON.stringify(storage));

    await renderDailyQuiz();

    await waitFor(() => {
      expect(screen.getByText("今日のクイズは完了済みです")).toBeTruthy();
    });

    const { createDailyQuestion, createQuestion } = await import("../quiz-core");
    expect(vi.mocked(createDailyQuestion)).not.toHaveBeenCalled();
    expect(vi.mocked(createQuestion)).toHaveBeenCalledTimes(1);
  });

  it("localStorage が空なら新規プレイで revealedHintCount=1 から始まる", async () => {
    await renderDailyQuiz();

    // 1つ目のヒントだけ表示、2つ目は ??? のまま
    await waitFor(() => {
      expect(screen.queryAllByText("VAL_HINT_1").length).toBeGreaterThan(0);
    });
    expect(screen.queryAllByText("VAL_HINT_2").length).toBe(0);
    expect(screen.queryByText("今日のクイズは完了済みです")).toBeNull();

    const { createDailyQuestion, createQuestion } = await import("../quiz-core");
    expect(vi.mocked(createDailyQuestion)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(createQuestion)).not.toHaveBeenCalled();
  });
});
