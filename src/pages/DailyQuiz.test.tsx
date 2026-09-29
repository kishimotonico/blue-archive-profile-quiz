// @vitest-environment jsdom
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { BrowserRouter } from "react-router-dom";
import { Suspense } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DailyQuiz from "./DailyQuiz";
import type { DailyHistory, DailyProgress } from "../store/daily";
import { dailyProgressAtom, dailyHistoryAtom } from "../store/daily";

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
    getDailyDate: vi.fn().mockReturnValue("2026-04-21"),
    createDailyQuestion: vi.fn().mockReturnValue(mockQuestion),
    createQuestion: vi.fn().mockReturnValue(mockQuestion),
  };
});

vi.mock("../store/students", async () => {
  const { atom } = await import("jotai");
  return { allStudentsAtom: atom(async () => [mockStudent]) };
});

vi.mock("../components/quiz/portraitImageUrl", () => ({
  preloadPortraitImage: vi.fn(),
  getPortraitImageUrl: vi.fn().mockReturnValue("about:blank"),
  NO_IMAGE_URL: "about:blank",
}));

const renderDailyQuiz = async (store: ReturnType<typeof createStore> = createStore()) => {
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
  return { ...result!, store };
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
    const store = createStore();
    store.set(dailyProgressAtom, progress);

    await renderDailyQuiz(store);

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
    const history: DailyHistory = {
      schemaVersion: 1,
      records: [
        {
          key: PROGRESS_KEY,
          result: {
            studentId: "s1",
            usedHintCount: 3,
            correct: true,
            userAnswer: "s1",
            score: 8,
          },
          playedAt: 1234567890,
        },
      ],
    };
    const store = createStore();
    store.set(dailyHistoryAtom, history);

    await renderDailyQuiz(store);

    await waitFor(() => {
      expect(screen.getByText("今日のクイズは完了済みです")).toBeTruthy();
    });

    const { createDailyQuestion, createQuestion } = await import("../quiz-core");
    expect(vi.mocked(createDailyQuestion)).not.toHaveBeenCalled();
    expect(vi.mocked(createQuestion)).toHaveBeenCalledTimes(1);
  });

  it("保存済み10点を再訪すると、結果モーダルに10点・ランクSSが表示され、結果が二重に記録されない", async () => {
    const history: DailyHistory = {
      schemaVersion: 1,
      records: [
        {
          key: PROGRESS_KEY,
          result: {
            studentId: "s1",
            usedHintCount: 1,
            correct: true,
            userAnswer: "タロウ",
            score: 10,
          },
          playedAt: 1234567890,
        },
      ],
    };
    const store = createStore();
    store.set(dailyHistoryAtom, history);

    await renderDailyQuiz(store);

    await waitFor(() => {
      expect(screen.getByText("今日のクイズは完了済みです")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "結果を見る" }));

    const dialog = screen.getByRole("dialog", { name: "今日のクイズの結果" });
    expect(dialog.textContent).toContain("10");
    expect(screen.getByText("ランク SS")).toBeTruthy();

    // 再訪時の record effect が走っても records は増えない（baseDate が既にあれば何もしない）
    expect(store.get(dailyHistoryAtom).records).toHaveLength(1);
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

describe("DailyQuiz - 結果モーダル", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("回答しても自動では開かず、「結果を見る」で開く", async () => {
    // jsdomにはscrollIntoViewが無いため、HintListのシルエット表示時スクロールをスタブする
    Element.prototype.scrollIntoView = vi.fn();

    // 全ヒント開示済みにして「諦めて正解を表示」ボタンをすぐ押せる状態にする
    const progress: DailyProgress = {
      key: PROGRESS_KEY,
      revealedHintCount: mockQuestion.hints.length + 1,
    };
    const store = createStore();
    store.set(dailyProgressAtom, progress);

    await renderDailyQuiz(store);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "諦めて正解を表示" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "諦めて正解を表示" }));
    expect(screen.queryByRole("dialog", { name: "今日のクイズの結果" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "結果を見る" }));
    expect(screen.getByRole("dialog", { name: "今日のクイズの結果" })).toBeTruthy();
  });
});
