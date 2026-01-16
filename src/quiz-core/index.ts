// 型定義
export type {
  Student,
  HintType,
  Hint,
  QuizQuestion,
  QuizState,
} from './types';

// 生徒データ
export {
  loadStudents,
  extractFamilyName,
  getStudentById,
  getRandomStudent,
  getRandomStudents,
} from './students';

// ヒント生成
export {
  generateHints,
  shuffleHints,
  createQuizQuestion,
} from './hints';

// 日替わりクイズ
export {
  getDailyDate,
  dateToSeed,
  getDailySeed,
  getSeedForDate,
  getNextDailyResetTime,
  getTimeUntilNextReset,
} from './daily';

// 回答判定
export {
  hiraganaToKatakana,
  normalizeAnswer,
  checkAnswer,
  getAnswerVariants,
} from './answer';

// スコア計算
export {
  calculateScore,
  getMaxScore,
  getScoreRank,
} from './scoring';
