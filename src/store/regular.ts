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

export function loadRegularQuizProgress(): RegularQuizProgress | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(REGULAR_QUIZ_PROGRESS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RegularQuizProgress;
  } catch {
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
