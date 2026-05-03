import { CURRENT_ALGORITHM_VERSION, type QuizKey } from "./key";
import type { QuizQuestion } from "./types";
import { createQuestion } from "./quiz";

// JST 4:00 = UTC+5 0:00
const QUIZ_DAY_OFFSET_MS = 5 * 60 * 60 * 1000;

export function getDailyDate(): string {
  const now = new Date();
  const quizDayTime = new Date(now.getTime() + QUIZ_DAY_OFFSET_MS);

  const year = quizDayTime.getUTCFullYear();
  const month = String(quizDayTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(quizDayTime.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function dateToSeed(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return year * 10000 + month * 100 + day;
}

export function getDailyQuizKey(date?: string): QuizKey {
  const baseDate = date ?? getDailyDate();
  return {
    version: CURRENT_ALGORITHM_VERSION,
    baseDate,
    seed: dateToSeed(baseDate),
  };
}

export async function createDailyQuestion(date?: string): Promise<QuizQuestion> {
  return createQuestion(getDailyQuizKey(date));
}

export function getNextQuizDate(date?: string): string {
  const base = date ?? getDailyDate();
  const [y, m, d] = base.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

export function getNextDailyResetTime(): Date {
  const now = new Date();
  const quizDayTime = new Date(now.getTime() + QUIZ_DAY_OFFSET_MS);

  const nextReset = new Date(
    Date.UTC(
      quizDayTime.getUTCFullYear(),
      quizDayTime.getUTCMonth(),
      quizDayTime.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  );

  return new Date(nextReset.getTime() - QUIZ_DAY_OFFSET_MS);
}

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
