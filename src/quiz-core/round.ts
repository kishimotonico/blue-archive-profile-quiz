import type { QuestionResult, QuizQuestion, Student } from "./types";
import { calculateScore } from "./scoring";
import { validateAnswer } from "./answer";

/**
 * 一問の進行状態。playing/answered の2状態のみとし、入力エラーや演出中は含めない
 * （それらは React 側のローカル state が担う）。
 */
export type RoundState =
  | { status: "playing"; question: QuizQuestion; revealedHintCount: number }
  | { status: "answered"; question: QuizQuestion; result: QuestionResult };

// 保存・復元用。question は key から再生成できるため持たない。
export type RoundSnapshot =
  | { status: "playing"; revealedHintCount: number }
  | { status: "answered"; result: QuestionResult };

export type RoundAction =
  | { type: "reveal" }
  | { type: "submit"; answer: string; correct: boolean } // 判定済みの確定回答のみ受け取る
  | { type: "giveUp" };

/** controller の submit 呼び出し結果。unknownStudent は入力欄の文字を残す判断に使う。 */
export type SubmitOutcome = "accepted" | "unknownStudent";

export function startRound(question: QuizQuestion): RoundState {
  return { status: "playing", question, revealedHintCount: 1 };
}

export function restoreRound(question: QuizQuestion, snapshot: RoundSnapshot): RoundState {
  if (snapshot.status === "playing") {
    return { status: "playing", question, revealedHintCount: snapshot.revealedHintCount };
  }
  return { status: "answered", question, result: snapshot.result };
}

export function toRoundSnapshot(state: RoundState): RoundSnapshot {
  if (state.status === "playing") {
    return { status: "playing", revealedHintCount: state.revealedHintCount };
  }
  return { status: "answered", result: state.result };
}

export function roundReducer(state: RoundState, action: RoundAction): RoundState {
  switch (action.type) {
    case "reveal":
      return reveal(state);
    case "submit":
      return finalize(state, { userAnswer: action.answer, correct: action.correct });
    case "giveUp":
      return finalize(state, { userAnswer: null, correct: false });
  }
}

function reveal(state: RoundState): RoundState {
  if (state.status !== "playing") return state;
  const maxCount = state.question.hints.length + 1;
  if (state.revealedHintCount >= maxCount) return state;
  return { ...state, revealedHintCount: state.revealedHintCount + 1 };
}

function finalize(
  state: RoundState,
  outcome: { userAnswer: string | null; correct: boolean },
): RoundState {
  if (state.status !== "playing") return state;
  const usedHintCount = state.revealedHintCount;
  return {
    status: "answered",
    question: state.question,
    result: {
      studentId: state.question.student.id,
      usedHintCount,
      correct: outcome.correct,
      userAnswer: outcome.userAnswer,
      score: calculateScore(usedHintCount, outcome.correct),
    },
  };
}

export type SubmitJudgement =
  | { type: "correct" } // → controller が submit を dispatch する
  | { type: "wrong" } // → controller が submit を dispatch する
  | { type: "unknownStudent" } // → dispatch しない。入力を残してエラー表示
  | { type: "ignored" }; // → answered 中の submit

/**
 * allStudents を reducer に持たせず判定専用の関数に分けることで、
 * roundReducer を問題と行動だけで決まる純粋な状態機械に保つ。
 */
export function judgeSubmit(
  state: RoundState,
  answer: string,
  allStudents: readonly Student[],
): SubmitJudgement {
  if (state.status === "answered") return { type: "ignored" };

  const result = validateAnswer(answer, state.question.student, allStudents);
  if (result.type === "correct") return { type: "correct" };
  if (result.type === "wrong_student") return { type: "wrong" };
  return { type: "unknownStudent" };
}
