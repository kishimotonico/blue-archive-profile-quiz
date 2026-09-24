import type { QuestionResult, QuizQuestion } from "./types";
import type { QuizKey } from "./key";
import { roundReducer, startRound, type RoundAction, type RoundState } from "./round";

export type RegularSession = {
  masterKey: QuizKey;
  questions: QuizQuestion[];
  index: number;
  results: QuestionResult[]; // index より前の確定結果。ready の間は results.length === index
  round: RoundState;
};

export type RegularState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; session: RegularSession }
  // 最終問の結果も session.results に含める。ページは最後の画面をそのまま描けばよく、
  // /result への遷移は controller の effect に任せる（reducer は遷移を知らない）。
  | { status: "finished"; session: RegularSession };

export type RegularAction =
  | { type: "loaded"; session: RegularSession }
  | { type: "failed" }
  | { type: "round"; action: RoundAction }
  | { type: "next" };

export function regularSessionReducer(state: RegularState, action: RegularAction): RegularState {
  switch (action.type) {
    case "loaded":
      return { status: "ready", session: action.session };
    case "failed":
      return { status: "error" };
    case "round":
      return applyRound(state, action.action);
    case "next":
      return applyNext(state);
  }
}

function applyRound(state: RegularState, action: RoundAction): RegularState {
  if (state.status !== "ready") return state;
  const round = roundReducer(state.session.round, action);
  if (round === state.session.round) return state;
  return { status: "ready", session: { ...state.session, round } };
}

function applyNext(state: RegularState): RegularState {
  if (state.status !== "ready") return state;
  const { session } = state;
  if (session.round.status !== "answered") return state;

  const results = [...session.results, session.round.result];
  const nextIndex = session.index + 1;

  if (nextIndex >= session.questions.length) {
    // index と round は据え置く（不変条件は崩れるが、finished の間はページが
    // 最後の問題の画面を描き続けるために round の参照が要る）。
    return { status: "finished", session: { ...session, results } };
  }

  return {
    status: "ready",
    session: {
      ...session,
      results,
      index: nextIndex,
      round: startRound(session.questions[nextIndex]),
    },
  };
}
