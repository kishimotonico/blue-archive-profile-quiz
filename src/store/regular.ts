import { z } from "zod";
import { CURRENT_ALGORITHM_VERSION } from "../quiz-core";
import type { QuizKey, QuestionResult } from "../quiz-core";

export interface RegularQuizCurrentQuestionState {
  revealedHintCount: number;
  answered: boolean;
  correct: boolean;
  score: number;
  lastConfirmedAnswer: string | null;
}

export interface RegularQuizProgress {
  schemaVersion: 2;
  masterKey: QuizKey;
  totalQuestions: number;
  currentQuestionIndex: number;
  results: QuestionResult[];
  currentQuestionState: RegularQuizCurrentQuestionState;
}

export const REGULAR_QUIZ_PROGRESS_KEY = "blue-archive-quiz-regular-progress-v2";

export const DEFAULT_CURRENT_QUESTION_STATE: RegularQuizCurrentQuestionState = {
  revealedHintCount: 1,
  answered: false,
  correct: false,
  score: 10,
  lastConfirmedAnswer: null,
};

const questionResultSchema: z.ZodType<QuestionResult> = z
  .object({
    studentId: z.string(),
    revealedHintCount: z.number(),
    correct: z.boolean(),
    userAnswer: z.string().nullable(),
    score: z.number(),
  })
  .passthrough();

const regularQuizCurrentQuestionStateSchema: z.ZodType<RegularQuizCurrentQuestionState> = z
  .object({
    revealedHintCount: z.number(),
    answered: z.boolean(),
    correct: z.boolean(),
    score: z.number(),
    lastConfirmedAnswer: z.string().nullable(),
  })
  .passthrough();

const regularQuizProgressSchema: z.ZodType<RegularQuizProgress> = z
  .object({
    schemaVersion: z.literal(2),
    masterKey: z
      .object({
        version: z.literal(CURRENT_ALGORITHM_VERSION),
        baseDate: z.string(),
        seed: z.number(),
      })
      .passthrough(),
    totalQuestions: z.number(),
    currentQuestionIndex: z.number(),
    results: z.array(questionResultSchema),
    currentQuestionState: regularQuizCurrentQuestionStateSchema,
  })
  .passthrough()
  .refine((progress) => progress.results.length === progress.currentQuestionIndex);

// sessionStorage を直接扱うことでタブごと独立した進捗管理にする。
// 再読み込み時は継続されるが、別タブでは干渉しない。
// jotai の atom にしないのは、useRegularQuiz 内でしか参照されず派生 atom も不要なため。

export function loadRegularQuizProgress(): RegularQuizProgress | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(REGULAR_QUIZ_PROGRESS_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    const result = regularQuizProgressSchema.safeParse(parsed);
    if (!result.success) {
      sessionStorage.removeItem(REGULAR_QUIZ_PROGRESS_KEY);
      return null;
    }
    return result.data;
  } catch {
    sessionStorage.removeItem(REGULAR_QUIZ_PROGRESS_KEY);
    return null;
  }
}

export function saveRegularQuizProgress(progress: RegularQuizProgress): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(REGULAR_QUIZ_PROGRESS_KEY, JSON.stringify(progress));
}

export function clearRegularQuizProgress(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(REGULAR_QUIZ_PROGRESS_KEY);
}
