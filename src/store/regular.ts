import { CURRENT_ALGORITHM_VERSION } from "../quiz-core";
import type { QuizKey } from "../quiz-core";

export interface RegularQuizCurrentQuestionState {
  revealedHintCount: number;
  answered: boolean;
  correct: boolean;
  score: number;
}

export interface RegularQuizProgress {
  masterKey: QuizKey;
  totalQuestions: number;
  currentQuestionIndex: number;
  scores: number[];
  currentQuestionState: RegularQuizCurrentQuestionState;
}

export const REGULAR_QUIZ_PROGRESS_KEY = "blue-archive-quiz-regular-progress-v1";

export const DEFAULT_CURRENT_QUESTION_STATE: RegularQuizCurrentQuestionState = {
  revealedHintCount: 1,
  answered: false,
  correct: false,
  score: 10,
};

// sessionStorage を直接扱うことでタブごと独立した進捗管理にする。
// 再読み込み時は継続されるが、別タブでは干渉しない。
// jotai の atom にしないのは、useRegularQuiz 内でしか参照されず派生 atom も不要なため。

function isValidProgress(value: unknown): value is RegularQuizProgress {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  const masterKey = v.masterKey as Record<string, unknown> | undefined;
  if (
    !masterKey ||
    typeof masterKey !== "object" ||
    masterKey.version !== CURRENT_ALGORITHM_VERSION ||
    typeof masterKey.baseDate !== "string" ||
    typeof masterKey.seed !== "number"
  ) {
    return false;
  }
  if (typeof v.totalQuestions !== "number") return false;
  if (typeof v.currentQuestionIndex !== "number") return false;
  if (!Array.isArray(v.scores)) return false;
  const cqs = v.currentQuestionState as Record<string, unknown> | undefined;
  if (
    !cqs ||
    typeof cqs !== "object" ||
    typeof cqs.revealedHintCount !== "number" ||
    typeof cqs.answered !== "boolean" ||
    typeof cqs.correct !== "boolean" ||
    typeof cqs.score !== "number"
  ) {
    return false;
  }
  return true;
}

export function loadRegularQuizProgress(): RegularQuizProgress | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(REGULAR_QUIZ_PROGRESS_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isValidProgress(parsed)) {
      sessionStorage.removeItem(REGULAR_QUIZ_PROGRESS_KEY);
      return null;
    }
    return parsed;
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
