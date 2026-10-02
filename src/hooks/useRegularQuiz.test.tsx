// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { Suspense, type ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useRegularQuiz } from "./useRegularQuiz";
import { REGULAR_QUIZ_PROGRESS_KEY, type RegularQuizProgress } from "../store/regular";
import type { QuizQuestion, Student } from "../quiz-core";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const { students, questions } = vi.hoisted(() => {
  const makeStudent = (id: string, fullName: string, name: string): unknown => ({
    id,
    fullName,
    name,
    school: "テスト学園",
    grade: "1年生",
    club: "テスト部",
    age: "15歳",
    birthday: "1月1日",
    height: "160cm",
    hobby: "テスト",
    weaponName: "テスト銃",
    cv: "テストCV",
    portraitImage: `images/${id}.png`,
    availableFrom: "2026-04-21",
    skills: { ex: "", normal: "", passive: "", sub: "" },
  });
  const s1 = makeStudent("s1", "テスト太郎", "タロウ");
  const s2 = makeStudent("s2", "テスト次郎", "ジロウ");
  const others = Array.from({ length: 8 }, (_, i) =>
    makeStudent(`s${i + 3}`, `テスト生徒${i + 3}`, `セイト${i + 3}`),
  );
  const students = [s1, s2, ...others];

  const makeQuestion = (student: unknown, seed: number): unknown => ({
    student,
    hints: [{ type: "school", label: "学園", value: "テスト学園" }],
    key: { version: 2, baseDate: "2026-04-21", seed },
  });

  // 先頭2問はわざと同じ生徒にして「次問が playing・開示1で始まる」ケースを作る
  const questions = [
    makeQuestion(s1, 1),
    makeQuestion(s1, 2),
    ...others.map((s, i) => makeQuestion(s, i + 3)),
  ];

  return { students, questions };
});

vi.mock("../quiz-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../quiz-core")>();
  return {
    ...actual,
    createQuestionSet: vi.fn().mockReturnValue(questions),
  };
});

vi.mock("../store/students", async () => {
  const { atom } = await import("jotai");
  return { allStudentsAtom: atom(async () => students) };
});

vi.mock("../components/quiz/portraitImageUrl", () => ({
  preloadPortraitImage: vi.fn(),
  getPortraitImageUrl: vi.fn().mockReturnValue("about:blank"),
  NO_IMAGE_URL: "about:blank",
}));

const renderRegularQuiz = async () => {
  const store = createStore();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <Suspense fallback={null}>{children}</Suspense>
    </Provider>
  );
  let rendered!: ReturnType<typeof renderHook<ReturnType<typeof useRegularQuiz>, unknown>>;
  await act(async () => {
    rendered = renderHook(() => useRegularQuiz(), { wrapper });
  });
  await waitFor(() => expect(rendered.result.current.view).toBeTruthy());
  return rendered;
};

const s1 = students[0] as Student;

beforeEach(() => {
  sessionStorage.clear();
  mockNavigate.mockClear();
});

describe("useRegularQuiz - 途中再開", () => {
  it("sessionStorage の進捗（index 2, round playing 3）から再開できる", async () => {
    const progress: RegularQuizProgress = {
      schemaVersion: 3,
      masterKey: { version: 2, baseDate: "2026-04-21", seed: 0 },
      results: [
        { studentId: s1.id, usedHintCount: 1, correct: true, userAnswer: s1.name, score: 10 },
        { studentId: s1.id, usedHintCount: 2, correct: true, userAnswer: s1.name, score: 9 },
      ],
      round: { status: "playing", revealedHintCount: 3 },
    };
    sessionStorage.setItem(REGULAR_QUIZ_PROGRESS_KEY, JSON.stringify(progress));

    const { result } = await renderRegularQuiz();

    expect(result.current.view.index).toBe(2);
    expect(result.current.view.round).toEqual({
      status: "playing",
      question: (questions as QuizQuestion[])[2],
      revealedHintCount: 3,
    });
  });
});

describe("useRegularQuiz - 10問目の next", () => {
  it("進捗が sessionStorage から消え、/result に10件の results が渡る", async () => {
    const { result } = await renderRegularQuiz();

    for (let i = 0; i < 10; i++) {
      const question = (questions as QuizQuestion[])[i];
      act(() => {
        result.current.submit(question.student.fullName);
      });
      act(() => {
        result.current.next();
      });
    }

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledTimes(1));

    expect(mockNavigate).toHaveBeenCalledWith(
      "/result",
      expect.objectContaining({ replace: true }),
    );
    const [, navArgs] = mockNavigate.mock.calls[0];
    expect(navArgs.state.results).toHaveLength(10);
    expect(sessionStorage.getItem(REGULAR_QUIZ_PROGRESS_KEY)).toBeNull();
  });
});

describe("useRegularQuiz - 同じ生徒が続く問題", () => {
  it("next で次の問題が playing・開示1 で始まる", async () => {
    const { result } = await renderRegularQuiz();

    act(() => {
      result.current.submit(s1.fullName);
    });

    act(() => {
      result.current.next();
    });

    expect(result.current.view.round).toEqual({
      status: "playing",
      question: (questions as QuizQuestion[])[1],
      revealedHintCount: 1,
    });
  });
});

describe("useRegularQuiz - submit", () => {
  it("unknownStudent を返し、状態は playing のまま進まない", async () => {
    const { result } = await renderRegularQuiz();

    let outcome!: string;
    act(() => {
      outcome = result.current.submit("存在しない生徒名");
    });

    expect(outcome).toBe("unknownStudent");
    expect(result.current.view.round.status).toBe("playing");
  });
});
