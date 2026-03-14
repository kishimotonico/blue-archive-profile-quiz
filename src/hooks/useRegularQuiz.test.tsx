// @vitest-environment jsdom
import { renderHook, act, waitFor } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { useRegularQuiz } from "./useRegularQuiz";
import { answeredAtom, scoreAtom } from "../store/quiz";

// --- フィクスチャ（vi.mock のホイストより前に評価されるよう vi.hoisted で定義）---

const { mockStudents, mockQuestion } = vi.hoisted(() => {
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
    skills: { ex: "", normal: "", passive: "", sub: "" },
  });

  const students = Array.from({ length: 10 }, (_, i) => makeStudent(`s${i + 1}`));
  const question = {
    student: students[0],
    hints: [{ type: "school", label: "学園", value: "テスト学園 / 1年生" }],
  };

  return { mockStudents: students, mockQuestion: question };
});

// --- モック ---

vi.mock("../quiz-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../quiz-core")>();
  return {
    ...actual,
    loadStudents: vi.fn().mockResolvedValue(mockStudents),
    getRandomStudents: vi.fn().mockResolvedValue(mockStudents),
    createQuizQuestion: vi.fn().mockReturnValue(mockQuestion),
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

// --- テスト ---

describe("useRegularQuiz - goNext() の二重計上防止", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    mockNavigate.mockClear();
  });

  const createWrapper = () => {
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
    return Wrapper;
  };

  it("answered=false のとき goNext() を呼んでもスコアが追加されない", async () => {
    const { result } = renderHook(() => useRegularQuiz(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // 初期状態: answered=false
    expect(result.current.answered).toBe(false);
    expect(result.current.totalScore).toBe(0);

    act(() => result.current.goNext());

    expect(result.current.totalScore).toBe(0);
  });

  it("answered=true のとき goNext() でスコアが1回だけ追加される", async () => {
    const { result } = renderHook(() => useRegularQuiz(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // answered=true, score=7 を直接セット
    act(() => {
      store.set(answeredAtom, true);
      store.set(scoreAtom, 7);
    });

    await waitFor(() => expect(result.current.answered).toBe(true));

    act(() => result.current.goNext());

    // 次の問題に進んでスコアが加算される（totalScore はリセット後なので scores 配列を確認）
    // 次の問題に移ったあと totalScore に 7 が蓄積されているはず
    // ただし goNext 後は resetQuiz() が呼ばれ currentQuestionIndex が進む
    // scores=[7] になっているので totalScore=7
    expect(result.current.totalScore).toBe(7);
  });

  it("goNext() を素早く2回呼んでもスコアは1回だけ追加される（二重計上防止）", async () => {
    const { result } = renderHook(() => useRegularQuiz(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // answered=true, score=7 をセット
    act(() => {
      store.set(answeredAtom, true);
      store.set(scoreAtom, 7);
    });

    await waitFor(() => expect(result.current.answered).toBe(true));

    // 同一 act 内で2回 goNext を呼ぶ
    act(() => {
      result.current.goNext();
      result.current.goNext();
    });

    // スコアは 7 であり、14 にはならないことを確認
    expect(result.current.totalScore).toBe(7);
  });

  it("全問回答後に navigate('/result') が正しい totalScore で呼ばれる", async () => {
    const { result } = renderHook(() => useRegularQuiz(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // 10問分ループ
    for (let i = 0; i < 10; i++) {
      act(() => {
        store.set(answeredAtom, true);
        store.set(scoreAtom, 5); // 各問 5点
      });
      // answered=true を反映させる
      await waitFor(() => expect(result.current.answered).toBe(true));
      act(() => result.current.goNext());
      // navigate が最後の問で呼ばれるまで待つ（最後以外は次問セットアップが走る）
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
