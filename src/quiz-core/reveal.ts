import type { PortraitState, Student } from "./types";
import type { RoundState } from "./round";
import { calculateScore } from "./scoring";

/**
 * 画面に表示するヒントの範囲。answered は再訪時も含めて常に全ヒントを見せる
 * （得点の記録は result.usedHintCount が担うため、表示範囲と分けてよい）。
 */
export function getVisibleHintCount(state: RoundState): number {
  if (state.status === "answered") return state.question.hints.length;
  return Math.min(state.revealedHintCount, state.question.hints.length);
}

/**
 * プレイヤーが自分の操作で開いたヒントの枚数。answered で表示範囲（全ヒント）との差が
 * 「回答後に開いたヒント」になる。usedHintCount は立ち絵段階で hints.length + 1 になり得るため頭打ちにする
 */
export function getPlayerRevealedHintCount(state: RoundState): number {
  const hintCount = state.question.hints.length;
  const used = state.status === "answered" ? state.result.usedHintCount : state.revealedHintCount;
  return Math.min(used, hintCount);
}

export function getPortraitState(state: RoundState): PortraitState {
  if (state.status === "answered") return "revealed";
  if (state.revealedHintCount > state.question.hints.length) return "silhouette";
  return "hidden";
}

/** playing 中に「いま正解したら何点か」。answered は結果の点数が別に出るため 0 */
export function getPotentialScore(state: RoundState): number {
  if (state.status === "answered") return 0;
  return calculateScore(state.revealedHintCount, true);
}

/** 開示ボタンが次に何をすべきかを示す。answered はボタン自体を出さないため null。 */
export function getNextStep(state: RoundState): "hint" | "silhouette" | "giveUp" | null {
  if (state.status === "answered") return null;
  if (state.revealedHintCount < state.question.hints.length) return "hint";
  if (state.revealedHintCount === state.question.hints.length) return "silhouette";
  return "giveUp";
}

export interface RoundView {
  student: Student;
  answered: boolean;
  correct: boolean;
  score: number;
  portraitState: PortraitState;
  visibleHintCount: number;
  nextStep: "hint" | "silhouette" | "giveUp" | null;
}

export function getRoundView(state: RoundState): RoundView {
  const answered = state.status === "answered";
  return {
    student: state.question.student,
    answered,
    correct: answered && state.result.correct,
    score: answered ? state.result.score : 0,
    portraitState: getPortraitState(state),
    visibleHintCount: getVisibleHintCount(state),
    nextStep: getNextStep(state),
  };
}
