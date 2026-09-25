import * as v from "valibot";
import { CURRENT_ALGORITHM_VERSION } from "../quiz-core";
import type { QuizKey, QuestionResult, RoundSnapshot } from "../quiz-core";

export interface RegularQuizProgress {
  schemaVersion: 3;
  masterKey: QuizKey;
  results: QuestionResult[];
  round: RoundSnapshot;
}

export const REGULAR_QUIZ_PROGRESS_KEY = "blue-archive-quiz-regular-progress-v3";

const questionResultSchema: v.GenericSchema<QuestionResult> = v.looseObject({
  studentId: v.string(),
  usedHintCount: v.number(),
  correct: v.boolean(),
  userAnswer: v.nullable(v.string()),
  score: v.number(),
});

const roundSnapshotSchema: v.GenericSchema<RoundSnapshot> = v.union([
  v.looseObject({
    status: v.literal("playing"),
    revealedHintCount: v.number(),
  }),
  v.looseObject({
    status: v.literal("answered"),
    result: questionResultSchema,
  }),
]);

const regularQuizProgressSchema: v.GenericSchema<RegularQuizProgress> = v.looseObject({
  schemaVersion: v.literal(3),
  masterKey: v.looseObject({
    version: v.literal(CURRENT_ALGORITHM_VERSION),
    baseDate: v.string(),
    seed: v.number(),
  }),
  results: v.array(questionResultSchema),
  round: roundSnapshotSchema,
});

// sessionStorage を直接扱うことでタブごと独立した進捗管理にする。
// 再読み込み時は継続されるが、別タブでは干渉しない。
// jotai の atom にしないのは、controller 内でしか参照されず派生 atom も不要なため。

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
