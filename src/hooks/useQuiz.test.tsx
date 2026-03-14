// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { describe, it, expect, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { useQuiz } from "./useQuiz";
import {
  currentQuestionAtom,
  allStudentsAtom,
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
  skills: { ex: "", normal: "", passive: "", sub: "" },
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
};

// --- ヘルパー ---

/** currentQuestion・allStudents をセットした状態でフックを起動する */
const setupHook = (store: ReturnType<typeof createStore>) => {
  store.set(allStudentsAtom, [s1, s2]);
  store.set(currentQuestionAtom, mockQuestion);

  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return renderHook(() => useQuiz(), { wrapper });
};

/** currentQuestion を null のまま（allStudents のみセット）フックを起動する */
const setupHookWithoutQuestion = (store: ReturnType<typeof createStore>) => {
  store.set(allStudentsAtom, [s1, s2]);

  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return renderHook(() => useQuiz(), { wrapper });
};

// --- テスト ---

describe("useQuiz - revealNextHint", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("ヒントが1つ開示される（revealedHintCount: 1 → 2）", () => {
    const { result } = setupHook(store);

    expect(result.current.revealedHintCount).toBe(1);

    act(() => result.current.revealNextHint());

    expect(result.current.revealedHintCount).toBe(2);
  });

  it("answered=true のときは無視される", () => {
    const { result } = setupHook(store);
    act(() => store.set(answeredAtom, true));

    act(() => result.current.revealNextHint());

    expect(result.current.revealedHintCount).toBe(1);
  });

  it("revealedHintCount === hints.length のときはまだインクリメントできる", () => {
    const { result } = setupHook(store);
    act(() => store.set(revealedHintCountAtom, mockQuestion.hints.length));

    act(() => result.current.revealNextHint());

    expect(result.current.revealedHintCount).toBe(mockQuestion.hints.length + 1);
  });

  it("revealedHintCount > hints.length のときは上限ガードで無視される", () => {
    const { result } = setupHook(store);
    act(() => store.set(revealedHintCountAtom, mockQuestion.hints.length + 1));

    act(() => result.current.revealNextHint());

    expect(result.current.revealedHintCount).toBe(mockQuestion.hints.length + 1);
  });

  it("currentQuestion=null のときは何もしない", () => {
    const { result } = setupHookWithoutQuestion(store);

    act(() => result.current.revealNextHint());

    expect(result.current.revealedHintCount).toBe(1);
  });
});

describe("useQuiz - submitAnswer", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("正解（fullName 入力）: correct=true, answered=true, score が計算される", () => {
    const { result } = setupHook(store);

    act(() => result.current.submitAnswer(s1.fullName));

    expect(result.current.correct).toBe(true);
    expect(result.current.answered).toBe(true);
    expect(result.current.score).toBeGreaterThan(0);
  });

  it("誤答（別の生徒名）: correct=false, answered=true, score=0", () => {
    const { result } = setupHook(store);

    act(() => result.current.submitAnswer(s2.fullName));

    expect(result.current.correct).toBe(false);
    expect(result.current.answered).toBe(true);
    expect(result.current.score).toBe(0);
  });

  it("存在しない入力: 「該当する生徒が見つかりません」がセットされ、answered=false のまま", () => {
    const { result } = setupHook(store);

    act(() => result.current.submitAnswer("存在しない生徒名"));

    expect(result.current.answerFeedback).toBe("該当する生徒が見つかりません");
    expect(result.current.answered).toBe(false);
  });

  it("存在しない入力を連続送信すると errorKey がインクリメントされる", () => {
    const { result } = setupHook(store);
    const initialKey = result.current.errorKey;

    act(() => result.current.submitAnswer("存在しない名前1"));
    expect(result.current.errorKey).toBe(initialKey + 1);

    act(() => result.current.submitAnswer("存在しない名前2"));
    expect(result.current.errorKey).toBe(initialKey + 2);
  });

  it("unknown の後に wrong_student で回答すると answerFeedback が null になる", () => {
    const { result } = setupHook(store);

    act(() => result.current.submitAnswer("存在しない生徒名"));
    expect(result.current.answerFeedback).toBeTruthy();

    act(() => result.current.submitAnswer(s2.fullName));
    expect(result.current.answerFeedback).toBeNull();
  });

  it("answered=true のとき再送信しても無視される", () => {
    const { result } = setupHook(store);

    act(() => result.current.submitAnswer(s1.fullName));
    expect(result.current.answered).toBe(true);
    const scoreAfterFirst = result.current.score;

    act(() => result.current.submitAnswer(s2.fullName));

    expect(result.current.score).toBe(scoreAfterFirst);
    expect(result.current.correct).toBe(true);
  });

  it("正解時のスコアはヒント開示数に応じて変わる（1ヒント→10点、2ヒント→9点）", () => {
    // 1ヒントで正解
    const store1 = createStore();
    const { result: result1 } = setupHook(store1);
    act(() => result1.current.submitAnswer(s1.fullName));
    expect(result1.current.score).toBe(10);

    // 2ヒントで正解
    const store2 = createStore();
    const { result: result2 } = setupHook(store2);
    act(() => result2.current.revealNextHint());
    act(() => result2.current.submitAnswer(s1.fullName));
    expect(result2.current.score).toBe(9);
  });

  it("currentQuestion=null のときは何もしない", () => {
    const { result } = setupHookWithoutQuestion(store);

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

  it("correct=false, answered=true, score=0 になる", () => {
    const { result } = setupHook(store);

    act(() => result.current.giveUp());

    expect(result.current.correct).toBe(false);
    expect(result.current.answered).toBe(true);
    expect(result.current.score).toBe(0);
  });

  it("answered=true のときは無視される", () => {
    const { result } = setupHook(store);

    act(() => result.current.submitAnswer(s1.fullName));
    expect(result.current.correct).toBe(true);

    act(() => result.current.giveUp());

    expect(result.current.correct).toBe(true);
  });

  it("currentQuestion=null のときは何もしない", () => {
    const { result } = setupHookWithoutQuestion(store);

    act(() => result.current.giveUp());

    expect(result.current.answered).toBe(false);
  });
});

describe("useQuiz - resetQuiz", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("全状態が初期値に戻る（answered=false, score=10, revealedHintCount=1, currentQuestion=null）", () => {
    const { result } = setupHook(store);

    act(() => result.current.revealNextHint());
    expect(result.current.revealedHintCount).toBe(2);

    act(() => result.current.resetQuiz());

    expect(result.current.answered).toBe(false);
    expect(result.current.score).toBe(10);
    expect(result.current.revealedHintCount).toBe(1);
    expect(result.current.currentQuestion).toBeNull();
  });

  it("answered=true 後のリセットでも正しく初期化される", () => {
    const { result } = setupHook(store);

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
