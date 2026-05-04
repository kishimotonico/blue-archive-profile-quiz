// @vitest-environment jsdom
import { renderHook, act, waitFor } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Suspense, type ReactNode } from "react";
import { useRegularQuiz } from "./useRegularQuiz";
import { answeredAtom, scoreAtom } from "../store/quiz";
import { REGULAR_QUIZ_PROGRESS_KEY, type RegularQuizProgress } from "../store/regular";

function readProgress(): RegularQuizProgress | null {
  const raw = sessionStorage.getItem(REGULAR_QUIZ_PROGRESS_KEY);
  return raw ? (JSON.parse(raw) as RegularQuizProgress) : null;
}

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
    sessionStorage.clear();
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

describe("useRegularQuiz - 進捗永続化", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    sessionStorage.clear();
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

  const mountHook = async () => {
    let rendered!: ReturnType<typeof renderHook<ReturnType<typeof useRegularQuiz>, unknown>>;
    await act(async () => {
      rendered = renderHook(() => useRegularQuiz(), {
        wrapper: createWrapper(),
      });
    });
    await waitFor(() => expect(rendered.result.current.loading).toBe(false));
    return rendered;
  };

  it("進捗が空で起動すると新規 masterKey で progress atom が初期化される", async () => {
    await mountHook();

    const progress = readProgress();
    expect(progress).not.toBeNull();
    expect(progress?.totalQuestions).toBe(10);
    expect(progress?.currentQuestionIndex).toBe(0);
    expect(progress?.scores).toEqual([]);
    expect(progress?.masterKey.version).toBe(1);
    expect(progress?.masterKey.baseDate).toBe("2026-04-21");
  });

  it("進捗が存在する状態で起動すると復元される", async () => {
    const seededProgress: RegularQuizProgress = {
      masterKey: { version: 1, baseDate: "2026-04-21", seed: 12345 },
      totalQuestions: 10,
      currentQuestionIndex: 3,
      scores: [10, 9, 8],
      currentQuestionState: {
        revealedHintCount: 4,
        answered: false,
        correct: false,
        score: 7,
      },
    };
    sessionStorage.setItem(REGULAR_QUIZ_PROGRESS_KEY, JSON.stringify(seededProgress));

    const { result } = await mountHook();

    expect(result.current.currentQuestionIndex).toBe(3);
    expect(result.current.totalScore).toBe(27);
    expect(result.current.revealedHintCount).toBe(4);
    expect(result.current.answered).toBe(false);
    expect(result.current.score).toBe(7);
  });

  it("回答後に progress atom の currentQuestionState が更新される", async () => {
    await mountHook();

    act(() => {
      store.set(answeredAtom, true);
      store.set(scoreAtom, 6);
    });

    await waitFor(() => {
      const progress = readProgress();
      expect(progress?.currentQuestionState.answered).toBe(true);
      expect(progress?.currentQuestionState.score).toBe(6);
    });
  });

  it("goNext で次の問題へ進むと progress atom の index と scores が更新される", async () => {
    const { result } = await mountHook();

    act(() => {
      store.set(answeredAtom, true);
      store.set(scoreAtom, 8);
    });
    await waitFor(() => expect(result.current.answered).toBe(true));

    act(() => result.current.goNext());

    await waitFor(() => {
      const progress = readProgress();
      expect(progress?.currentQuestionIndex).toBe(1);
      expect(progress?.scores).toEqual([8]);
    });
  });

  it("version が CURRENT_ALGORITHM_VERSION と異なる進捗は破棄して新規生成される", async () => {
    const stale = {
      masterKey: { version: 999, baseDate: "2026-04-21", seed: 12345 },
      totalQuestions: 10,
      currentQuestionIndex: 3,
      scores: [10, 9, 8],
      currentQuestionState: { revealedHintCount: 4, answered: false, correct: false, score: 7 },
    };
    sessionStorage.setItem(REGULAR_QUIZ_PROGRESS_KEY, JSON.stringify(stale));

    const { result } = await mountHook();

    expect(result.current.currentQuestionIndex).toBe(0);
    expect(result.current.totalScore).toBe(0);
    const progress = readProgress();
    expect(progress?.masterKey.version).toBe(1);
    expect(progress?.masterKey.seed).not.toBe(12345);
  });

  it("shape が壊れた進捗は破棄して新規生成される", async () => {
    sessionStorage.setItem(
      REGULAR_QUIZ_PROGRESS_KEY,
      JSON.stringify({ garbage: "yes", masterKey: "not-an-object" }),
    );

    const { result } = await mountHook();

    expect(result.current.currentQuestionIndex).toBe(0);
    const progress = readProgress();
    expect(progress?.masterKey.version).toBe(1);
  });

  it("全問終了で progress atom が null にクリアされる", async () => {
    const { result } = await mountHook();

    for (let i = 0; i < 10; i++) {
      act(() => {
        store.set(answeredAtom, true);
        store.set(scoreAtom, 5);
      });
      await waitFor(() => expect(result.current.answered).toBe(true));
      act(() => result.current.goNext());
    }

    expect(readProgress()).toBeNull();
  });
});
