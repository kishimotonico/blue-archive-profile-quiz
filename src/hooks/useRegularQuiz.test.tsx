// @vitest-environment jsdom
import { renderHook, act, waitFor } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Suspense, type ReactNode } from "react";
import { useRegularQuiz } from "./useRegularQuiz";
import { answeredAtom, scoreAtom } from "../store/quiz";

const { mockStudents, mockQuestions } = vi.hoisted(() => {
  const makeStudent = (id: string) => ({
    id,
    fullName: `テスト${id}`,
    name: id,
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

  const students = Array.from({ length: 10 }, (_, i) => makeStudent(`s${i + 1}`));
  const questions = students.map((student, i) => ({
    student,
    hints: [{ type: "school", label: "学園", value: "テスト学園 / 1年生" }],
    key: { version: 1, baseDate: "2026-04-21", seed: i + 1 },
  }));

  return { mockStudents: students, mockQuestions: questions };
});

vi.mock("../quiz-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../quiz-core")>();
  return {
    ...actual,
    loadStudents: vi.fn().mockResolvedValue(mockStudents),
    getDailyDate: vi.fn().mockReturnValue("2026-04-21"),
    createQuestionSet: vi.fn().mockResolvedValue(mockQuestions),
  };
});

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("useRegularQuiz - goNext() の二重計上防止", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    mockNavigate.mockClear();
  });

  const createWrapper = () => {
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>
        <Suspense fallback={null}>{children}</Suspense>
      </Provider>
    );
    return Wrapper;
  };

  it("answered=false のとき goNext() を呼んでもスコアが追加されない", async () => {
    let rendered!: ReturnType<typeof renderHook<ReturnType<typeof useRegularQuiz>, unknown>>;
    await act(async () => {
      rendered = renderHook(() => useRegularQuiz(), {
        wrapper: createWrapper(),
      });
    });
    const { result } = rendered;

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.answered).toBe(false);
    expect(result.current.totalScore).toBe(0);

    act(() => result.current.goNext());

    expect(result.current.totalScore).toBe(0);
  });

  it("answered=true のとき goNext() でスコアが1回だけ追加される", async () => {
    let rendered!: ReturnType<typeof renderHook<ReturnType<typeof useRegularQuiz>, unknown>>;
    await act(async () => {
      rendered = renderHook(() => useRegularQuiz(), {
        wrapper: createWrapper(),
      });
    });
    const { result } = rendered;

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      store.set(answeredAtom, true);
      store.set(scoreAtom, 7);
    });

    await waitFor(() => expect(result.current.answered).toBe(true));

    act(() => result.current.goNext());

    expect(result.current.totalScore).toBe(7);
  });

  it("goNext() を素早く2回呼んでもスコアは1回だけ追加される（二重計上防止）", async () => {
    let rendered!: ReturnType<typeof renderHook<ReturnType<typeof useRegularQuiz>, unknown>>;
    await act(async () => {
      rendered = renderHook(() => useRegularQuiz(), {
        wrapper: createWrapper(),
      });
    });
    const { result } = rendered;

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      store.set(answeredAtom, true);
      store.set(scoreAtom, 7);
    });

    await waitFor(() => expect(result.current.answered).toBe(true));

    act(() => {
      result.current.goNext();
      result.current.goNext();
    });

    expect(result.current.totalScore).toBe(7);
  });

  it("全問回答後に navigate('/result') が正しい totalScore で呼ばれる", async () => {
    let rendered!: ReturnType<typeof renderHook<ReturnType<typeof useRegularQuiz>, unknown>>;
    await act(async () => {
      rendered = renderHook(() => useRegularQuiz(), {
        wrapper: createWrapper(),
      });
    });
    const { result } = rendered;

    await waitFor(() => expect(result.current.loading).toBe(false));

    for (let i = 0; i < 10; i++) {
      act(() => {
        store.set(answeredAtom, true);
        store.set(scoreAtom, 5);
      });
      await waitFor(() => expect(result.current.answered).toBe(true));
      act(() => result.current.goNext());
    }

    expect(mockNavigate).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith("/result", {
      state: {
        totalScore: 50,
        scores: Array(10).fill(5),
        totalQuestions: 10,
      },
    });
  });
});
