// 型定義
export type { Student, HintType, Hint, QuizQuestion, PortraitState, QuestionResult } from "./types";

// 結果処理
export { getQuestionOutcome } from "./result";
export type { QuestionOutcome } from "./result";
export type { QuizKey } from "./key";

// クイズキー
export { CURRENT_ALGORITHM_VERSION, encodeQuizKey, decodeQuizKey } from "./key";

// 生徒データ
export {
  loadStudents,
  getStudentById,
  getStudentPool,
  pickStudentV1,
  pickStudentV2,
  extractFamilyName,
} from "./students";

// ヒント生成
export { generateHintsV1, generateHintsV2 } from "./hints";

// クイズ生成（統一API）
export { createQuestion, createQuestionSet } from "./quiz";

// 乱数
export { seededRandomV1, shuffleV1, deriveSeedV1, seededRandomV2, shuffleV2 } from "./random";

// 日替わりクイズ
export {
  getDailyDate,
  dateToSeed,
  getDailyQuizKey,
  getNextQuizDate,
  getNextDailyResetTime,
  getTimeUntilNextReset,
  createDailyQuestion,
} from "./daily";

// 回答判定
export { checkAnswer, validateAnswer } from "./answer";
export type { AnswerResult } from "./answer";

// スコア計算
export { calculateScore, getMaxScore, getScoreRank } from "./scoring";

// 一問の進行状態
export { startRound, restoreRound, toRoundSnapshot, roundReducer, judgeSubmit } from "./round";
export type {
  RoundState,
  RoundSnapshot,
  RoundAction,
  SubmitJudgement,
  SubmitOutcome,
} from "./round";

// フリープレイのセッション
export { regularSessionReducer } from "./regularSession";
export type { RegularSession, RegularState, RegularAction } from "./regularSession";

// 日替わりのセッション
export { dailySessionReducer } from "./dailySession";
export type { DailySession, DailyState, DailyAction } from "./dailySession";

// 開示段階の導出
export {
  getTotalStages,
  getVisibleHintCount,
  getPortraitState,
  getRemainingStages,
  getPotentialScore,
  getNextStep,
} from "./reveal";
