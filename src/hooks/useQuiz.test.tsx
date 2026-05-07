// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Suspense, type ReactNode } from "react";
import { useQuiz } from "./useQuiz";
import {
  currentQuestionAtom,
  revealedHintCountAtom,
  answeredAtom,
} from "../store/quiz";
import type { Student, QuizQuestion } from "../quiz-core";

// --- フィクスチャ ---

const makeStudent = (id: string): Student => ({
  id,
  fullName: `テスト生徒${id}`,
  name: `生徒${id}`,
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

// allStudentsAtom は async atom 化されたため、loadStudents をモックして
// テスト用の生徒データを返すようにする。
const { mockStudents } = vi.hoisted(() => {
  const make = (id: string) => ({
    id,
    fullName: `テスト生徒${id}`,
    name: `生徒${id}`,
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
  return { mockStudents: [make("s1"), make("s2")] };
});

vi.mock("../quiz-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../quiz-core")>();
  return {
    ...actual,
    loadStudents: vi.fn().mockResolvedValue(mockStudents),
  };
});

const s1 = makeStudent("s1");
const s2 = makeStudent("s2");

const mockQuestion: QuizQuestion = {
  student: s1,
  hints: [
    { type: "school", label: "学園", value: "テスト学園" },
    { type: "club", label: "部活", value: "テスト部" },
    { type: "age", label: "年齢", value: "15歳" },
  ],
  key: { version: 1, baseDate: "2026-04-21", seed: 12345 },
};

// --- ヘルパー ---

/**
 * useQuiz を Suspense 境界付きでレンダーする。
 * allStudentsAtom (async atom) の解決を await act で待つ。
 */
const renderUseQuiz = async (store: ReturnType<typeof createStore>) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <Suspense fallback={null}>{children}</Suspense>
    </Provider>
  );
  let rendered!: ReturnType<typeof renderHook<ReturnType<typeof useQuiz>, unknown>>;
  await act(async () => {
    rendered = renderHook(() => useQuiz(), { wrapper });
  });
  return rendered;
};

/** currentQuestion・allStudents をセットした状態でフックを起動する */
const setupHook = async (store: ReturnType<typeof createStore>) => {
  store.set(currentQuestionAtom, mockQuestion);
  return renderUseQuiz(store);
};

/** currentQuestion を null のまま（allStudents のみセット）フックを起動する */
const setupHookWithoutQuestion = async (store: ReturnType<typeof createStore>) => {
  return renderUseQuiz(store);
};

// --- テスト ---

describe("useQuiz - revealNextHint", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("ヒントが1つ開示される（revealedHintCount: 1 → 2）", async () => {
    const { result } = await setupHook(store);

    expect(result.current.revealedHintCount).toBe(1);

    act(() => result.current.revealNextHint());

    expect(result.current.revealedHintCount).toBe(2);
  });

  it("answered=true のときは無視される", async () => {
    const { result } = await setupHook(store);
    act(() => store.set(answeredAtom, true));

    act(() => result.current.revealNextHint());

    expect(result.current.revealedHintCount).toBe(1);
  });

  it("revealedHintCount === hints.length のときはまだインクリメントできる", async () => {
    const { result } = await setupHook(store);
    act(() => store.set(revealedHintCountAtom, mockQuestion.hints.length));

    act(() => result.current.revealNextHint());

    expect(result.current.revealedHintCount).toBe(mockQuestion.hints.length + 1);
  });

  it("revealedHintCount > hints.length のときは上限ガードで無視される", async () => {
    const { result } = await setupHook(store);
    act(() => store.set(revealedHintCountAtom, mockQuestion.hints.length + 1));

    act(() => result.current.revealNextHint());

    expect(result.current.revealedHintCount).toBe(mockQuestion.hints.length + 1);
  });

  it("currentQuestion=null のときは何もしない", async () => {
    const { result } = await setupHookWithoutQuestion(store);

    act(() => result.current.revealNextHint());

    expect(result.current.revealedHintCount).toBe(1);
  });
});

describe("useQuiz - submitAnswer", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("正解（fullName 入力）: correct=true, answered=true, score が計算される", async () => {
    const { result } = await setupHook(store);

    act(() => result.current.submitAnswer(s1.fullName));

    expect(result.current.correct).toBe(true);
    expect(result.current.answered).toBe(true);
    expect(result.current.score).toBeGreaterThan(0);
    expect(result.current.lastConfirmedAnswer).toBe(s1.fullName);
  });

  it("誤答（別の生徒名）: correct=false, answered=true, score=0", async () => {
    const { result } = await setupHook(store);

    act(() => result.current.submitAnswer(s2.fullName));

    expect(result.current.correct).toBe(false);
    expect(result.current.answered).toBe(true);
    expect(result.current.score).toBe(0);
    expect(result.current.lastConfirmedAnswer).toBe(s2.fullName);
  });

  it("存在しない入力: 「該当する生徒が見つかりません」がセットされ、answered=false のまま", async () => {
    const { result } = await setupHook(store);

    act(() => result.current.submitAnswer("存在しない生徒名"));

    expect(result.current.answerFeedback).toBe("該当する生徒が見つかりません");
    expect(result.current.answered).toBe(false);
    expect(result.current.lastConfirmedAnswer).toBeNull();
  });

  it("unknown の後にギブアップしても確定回答は null のまま", async () => {
    const { result } = await setupHook(store);

    act(() => result.current.submitAnswer("存在しない生徒名"));
    act(() => result.current.giveUp());

    expect(result.current.answered).toBe(true);
    expect(result.current.correct).toBe(false);
    expect(result.current.lastConfirmedAnswer).toBeNull();
  });

  it("存在しない入力を連続送信すると errorKey がインクリメントされる", async () => {
    const { result } = await setupHook(store);
    const initialKey = result.current.errorKey;

    act(() => result.current.submitAnswer("存在しない名前1"));
    expect(result.current.errorKey).toBe(initialKey + 1);

    act(() => result.current.submitAnswer("存在しない名前2"));
    expect(result.current.errorKey).toBe(initialKey + 2);
  });

  it("unknown の後に wrong_student で回答すると answerFeedback が null になる", async () => {
    const { result } = await setupHook(store);

    act(() => result.current.submitAnswer("存在しない生徒名"));
    expect(result.current.answerFeedback).toBeTruthy();

    act(() => result.current.submitAnswer(s2.fullName));
    expect(result.current.answerFeedback).toBeNull();
  });

  it("answered=true のとき再送信しても無視される", async () => {
    const { result } = await setupHook(store);

    act(() => result.current.submitAnswer(s1.fullName));
    expect(result.current.answered).toBe(true);
    const scoreAfterFirst = result.current.score;

    act(() => result.current.submitAnswer(s2.fullName));

    expect(result.current.score).toBe(scoreAfterFirst);
    expect(result.current.correct).toBe(true);
  });

  it("正解時のスコアはヒント開示数に応じて変わる（1ヒント→10点、2ヒント→9点）", async () => {
    // 1ヒントで正解
    const store1 = createStore();
    const { result: result1 } = await setupHook(store1);
    act(() => result1.current.submitAnswer(s1.fullName));
    expect(result1.current.score).toBe(10);

    // 2ヒントで正解
    const store2 = createStore();
    const { result: result2 } = await setupHook(store2);
    act(() => result2.current.revealNextHint());
    act(() => result2.current.submitAnswer(s1.fullName));
    expect(result2.current.score).toBe(9);
  });

  it("currentQuestion=null のときは何もしない", async () => {
    const { result } = await setupHookWithoutQuestion(store);

    act(() => result.current.submitAnswer(s1.fullName));

    expect(result.current.answered).toBe(false);
    expect(result.current.correct).toBe(false);
  });
});

describe("useQuiz - giveUp", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("correct=false, answered=true, score=0 になる", async () => {
    const { result } = await setupHook(store);

    act(() => result.current.giveUp());

    expect(result.current.correct).toBe(false);
    expect(result.current.answered).toBe(true);
    expect(result.current.score).toBe(0);
  });

  it("answered=true のときは無視される", async () => {
    const { result } = await setupHook(store);

    act(() => result.current.submitAnswer(s1.fullName));
    expect(result.current.correct).toBe(true);

    act(() => result.current.giveUp());

    expect(result.current.correct).toBe(true);
  });

  it("currentQuestion=null のときは何もしない", async () => {
    const { result } = await setupHookWithoutQuestion(store);

    act(() => result.current.giveUp());

    expect(result.current.answered).toBe(false);
  });
});

describe("useQuiz - resetQuiz", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("全状態が初期値に戻る（answered=false, score=10, revealedHintCount=1, currentQuestion=null）", async () => {
    const { result } = await setupHook(store);

    act(() => result.current.revealNextHint());
    expect(result.current.revealedHintCount).toBe(2);

    act(() => result.current.resetQuiz());

    expect(result.current.answered).toBe(false);
    expect(result.current.score).toBe(10);
    expect(result.current.revealedHintCount).toBe(1);
    expect(result.current.currentQuestion).toBeNull();
    expect(result.current.lastConfirmedAnswer).toBeNull();
  });

  it("answered=true 後のリセットでも正しく初期化される", async () => {
    const { result } = await setupHook(store);

    act(() => result.current.giveUp());
    expect(result.current.answered).toBe(true);

    act(() => result.current.resetQuiz());

    expect(result.current.answered).toBe(false);
    expect(result.current.score).toBe(10);
    expect(result.current.correct).toBe(false);
    expect(result.current.revealedHintCount).toBe(1);
    expect(result.current.currentQuestion).toBeNull();
  });
});
