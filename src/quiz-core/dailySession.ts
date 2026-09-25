import { roundReducer, type RoundAction, type RoundState } from "./round";

export type DailySession = {
  round: RoundState; // question.key.baseDate が日付
  completedOnLoad: boolean; // 「今日のクイズは完了済みです」の表示だけに使う
};

export type DailyState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; session: DailySession };

export type DailyAction =
  | { type: "loaded"; session: DailySession }
  | { type: "failed" }
  | { type: "round"; action: RoundAction };

export function dailySessionReducer(state: DailyState, action: DailyAction): DailyState {
  switch (action.type) {
    case "loaded":
      return { status: "ready", session: action.session };
    case "failed":
      return { status: "error" };
    case "round":
      return applyRound(state, action.action);
  }
}

function applyRound(state: DailyState, action: RoundAction): DailyState {
  if (state.status !== "ready") return state;
  const round = roundReducer(state.session.round, action);
  if (round === state.session.round) return state;
  return { status: "ready", session: { ...state.session, round } };
}
