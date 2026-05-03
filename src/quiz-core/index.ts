// 型定義
export type { Student, HintType, Hint, QuizQuestion, QuizState, PortraitState } from "./types";
export type { QuizKey } from "./key";

// クイズキー
export { CURRENT_ALGORITHM_VERSION, encodeQuizKey, decodeQuizKey } from "./key";

// 生徒データ
export { loadStudents, getStudentById, getStudentPool, pickStudentV1, extractFamilyName } from "./students";

// ヒント生成
export { generateHintsV1 } from "./hints";

// クイズ生成（統一API）
export { createQuestion, createQuestionSet } from "./quiz";

// 乱数
export { seededRandomV1, shuffleV1, deriveSeedV1 } from "./random";

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
