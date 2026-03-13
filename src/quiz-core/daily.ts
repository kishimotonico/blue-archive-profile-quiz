/**
 * 日替わりクイズ用のシード生成
 * 4:00 JST で日付が切り替わる
 */

import { getRandomStudent } from './students';
import { createQuizQuestion } from './hints';

/**
 * クイズ日付のオフセット（UTC+5 = JST 4:00基準）
 * JST 4:00 = UTC 19:00 (前日) = UTC+5 0:00 (当日)
 */
const QUIZ_DAY_OFFSET_MS = 5 * 60 * 60 * 1000;

/**
 * 現在の日替わりクイズの日付を取得（4:00 JST基準）
 * @returns YYYY-MM-DD形式の日付文字列
 */
export function getDailyDate(): string {
  const now = new Date();

  // UTC+5の時刻に変換（JST 4:00基準）
  const quizDayTime = new Date(now.getTime() + QUIZ_DAY_OFFSET_MS);

  // YYYY-MM-DD形式で返す
  const year = quizDayTime.getUTCFullYear();
  const month = String(quizDayTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(quizDayTime.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * 日付文字列からシードを生成
 */
export function dateToSeed(date: string): number {
  // YYYY-MM-DD を数値に変換
  const [year, month, day] = date.split('-').map(Number);
  // 日付を一意の数値に変換
  return year * 10000 + month * 100 + day;
}

/**
 * 現在の日替わりクイズ用のシードを取得
 */
export function getDailySeed(): number {
  const date = getDailyDate();
  return dateToSeed(date);
}

/**
 * 次の4:00 JSTまでの時刻を取得
 */
export function getNextDailyResetTime(): Date {
  const now = new Date();

  // UTC+5の時刻に変換（JST 4:00基準）
  const quizDayTime = new Date(now.getTime() + QUIZ_DAY_OFFSET_MS);

  // UTC+5での次の0:00（= JST 4:00）を計算
  const nextReset = new Date(Date.UTC(
    quizDayTime.getUTCFullYear(),
    quizDayTime.getUTCMonth(),
    quizDayTime.getUTCDate() + 1,
    0, 0, 0, 0
  ));

  // UTC時刻に変換して返す
  return new Date(nextReset.getTime() - QUIZ_DAY_OFFSET_MS);
}

/**
 * 次の更新までの時間を人間が読める形式で取得
 */
export function getTimeUntilNextReset(): string {
  const now = new Date();
  const nextReset = getNextDailyResetTime();
  const diff = nextReset.getTime() - now.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}時間${minutes}分後`;
  } else {
    return `${minutes}分後`;
  }
}

/**
 * 日替わりクイズの問題を生成
 * @param date 日付文字列（省略時は今日）
 */
export async function createDailyQuestion(date?: string) {
  const seed = date ? dateToSeed(date) : getDailySeed();
  const student = await getRandomStudent(seed);
  return createQuizQuestion(student, seed);
}
