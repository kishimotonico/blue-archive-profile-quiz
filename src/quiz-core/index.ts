// 型定義
export type { Student, Hint, QuizQuestion, PortraitState, QuestionResult, QuestionRecord } from "./types";

// 結果処理
export { getQuestionOutcome } from "./result";
export type { QuestionOutcome } from "./result";
export type { QuizKey } from "./key";

// クイズキー
export { CURRENT_ALGORITHM_VERSION } from "./key";

// 生徒データ
export { parseStudents } from "./students";
export type { StudentEntry } from "./students";

// クイズ生成（統一API）
export { createQuestion, createQuestionSet } from "./quiz";

// 日替わりクイズ
export {
  getDailyDate,
  getTimeUntilNextReset,
  formatTimeUntilNextReset,
  createDailyQuestion,
} from "./daily";

// スコア計算
export {
  getMaxScore,
  getScoreRank,
  getScoreRankLabel,
  SCORE_RANKS,
} from "./scoring";

// プレイ履歴の統計
export { summarizeRecords, summarizeResults } from "./stats";
export type { RecordStats, ResultsSummary } from "./stats";

// 一問の進行状態
export { startRound, restoreRound, toRoundSnapshot, roundReducer, judgeSubmit } from "./round";
export type { RoundState, RoundSnapshot, SubmitOutcome } from "./round";

// フリープレイのセッション
export { regularSessionReducer, getCurrentIndex } from "./regularSession";
export type { RegularSession, RegularState } from "./regularSession";

// 日替わりのセッション
export { dailySessionReducer } from "./dailySession";
export type { DailySession } from "./dailySession";

// 開示段階の導出
export { getTotalStages, getVisibleHintCount, getPortraitState, getRemainingStages, getNextStep } from "./reveal";
