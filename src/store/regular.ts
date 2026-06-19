import * as v from "valibot";
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

// looseObject は未知キーを保持する（旧 isValidProgress が余剰プロパティを無視していた挙動と等価）。
const questionResultSchema: v.GenericSchema<QuestionResult> = v.looseObject({
  studentId: v.string(),
  revealedHintCount: v.number(),
  correct: v.boolean(),
  userAnswer: v.nullable(v.string()),
  score: v.number(),
});

const regularQuizCurrentQuestionStateSchema: v.GenericSchema<RegularQuizCurrentQuestionState> =
  v.looseObject({
    revealedHintCount: v.number(),
    answered: v.boolean(),
    correct: v.boolean(),
    score: v.number(),
    lastConfirmedAnswer: v.nullable(v.string()),
  });

const regularQuizProgressSchema: v.GenericSchema<RegularQuizProgress> = v.pipe(
  v.looseObject({
    schemaVersion: v.literal(2),
    masterKey: v.looseObject({
      version: v.literal(CURRENT_ALGORITHM_VERSION),
      baseDate: v.string(),
      seed: v.number(),
    }),
    totalQuestions: v.number(),
    currentQuestionIndex: v.number(),
    results: v.array(questionResultSchema),
    currentQuestionState: regularQuizCurrentQuestionStateSchema,
  }),
  // results.length === currentQuestionIndex の不変条件を維持
  v.check((progress) => progress.results.length === progress.currentQuestionIndex),
);

// sessionStorage を直接扱うことでタブごと独立した進捗管理にする。
// 再読み込み時は継続されるが、別タブでは干渉しない。
// jotai の atom にしないのは、useRegularQuiz 内でしか参照されず派生 atom も不要なため。

export function loadRegularQuizProgress(): RegularQuizProgress | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(REGULAR_QUIZ_PROGRESS_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    const result = v.safeParse(regularQuizProgressSchema, parsed);
    if (!result.success) {
      sessionStorage.removeItem(REGULAR_QUIZ_PROGRESS_KEY);
      return null;
    }
    return result.output;
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
