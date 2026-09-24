import type { PortraitState } from "./types";
import type { RoundState } from "./round";
import { calculateScore } from "./scoring";

/** ヒント段階数 + 立ち絵（シルエット）の1段階。 */
export function getTotalStages(state: RoundState): number {
  return state.question.hints.length + 1;
}

/**
 * 画面に表示するヒントの範囲。answered は再訪時も含めて常に全ヒントを見せる
 * （得点の記録は result.usedHintCount が担うため、表示範囲と分けてよい）。
 */
export function getVisibleHintCount(state: RoundState): number {
  if (state.status === "answered") return state.question.hints.length;
  return Math.min(state.revealedHintCount, state.question.hints.length);
}

export function getPortraitState(state: RoundState): PortraitState {
  if (state.status === "answered") return "revealed";
  if (state.revealedHintCount > state.question.hints.length) return "silhouette";
  return "hidden";
}

export function getRemainingStages(state: RoundState): number {
  if (state.status === "answered") return 0;
  return getTotalStages(state) - state.revealedHintCount;
}

/** プレイ中に「いまの開示数で正解したら何点か」を示す用途。回答済みは確定済みの記録を見るため null。 */
export function getPotentialScore(state: RoundState): number | null {
  if (state.status === "answered") return null;
  return calculateScore(state.revealedHintCount, true);
}

/** 開示ボタンが次に何をすべきかを示す。answered はボタン自体を出さないため null。 */
export function getNextStep(state: RoundState): "hint" | "silhouette" | "giveUp" | null {
  if (state.status === "answered") return null;
  if (state.revealedHintCount < state.question.hints.length) return "hint";
  if (state.revealedHintCount === state.question.hints.length) return "silhouette";
  return "giveUp";
}
