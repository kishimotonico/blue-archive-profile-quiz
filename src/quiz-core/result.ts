import type { QuestionResult } from "./types";

export type QuestionOutcome = "correct" | "wrong" | "gaveUp";

export function getQuestionOutcome(r: QuestionResult): QuestionOutcome {
  if (r.correct) return "correct";
  return r.userAnswer === null ? "gaveUp" : "wrong";
}
