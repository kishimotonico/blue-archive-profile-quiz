import { roundReducer, type RoundAction, type RoundState } from "./round";

export type DailySession = {
  round: RoundState; // question.key.baseDate が日付
  completedOnLoad: boolean; // 「今日のクイズは完了済みです」の表示だけに使う
};

export function dailySessionReducer(session: DailySession, action: RoundAction): DailySession {
  const round = roundReducer(session.round, action);
  if (round === session.round) return session;
  return { ...session, round };
}
