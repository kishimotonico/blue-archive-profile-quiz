// 型定義
export type { Student, HintType, Hint, QuizQuestion, QuizState, PortraitState } from "./types";

// 生徒データ
export { loadStudents, getRandomStudent, getRandomStudents } from "./students";

// ヒント生成
export { generateHints, createQuizQuestion } from "./hints";

// 日替わりクイズ
export {
  getDailyDate,
  dateToSeed,
  getDailySeed,
  getNextDailyResetTime,
  getTimeUntilNextReset,
  createDailyQuestion,
} from "./daily";

// 回答判定
export { checkAnswer, validateAnswer } from "./answer";

export type { AnswerResult } from "./answer";

// スコア計算
export { calculateScore, getMaxScore, getScoreRank } from "./scoring";
