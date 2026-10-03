import type { ReactNode, RefObject } from "react";
import type { RoundState, SubmitOutcome } from "../../quiz-core";

/** submit はページから QuizBody までで使い、各レイアウトへは渡さない */
export interface QuizActions {
  reveal: () => void;
  submit: (answer: string) => SubmitOutcome;
  giveUp: () => void;
}

/** attempt は同じ文言が続いても吹き出しとシェイクを出し直すための識別値 */
export interface AnswerFeedbackError {
  message: string;
  attempt: number;
}

/** QuizBody が持つ回答欄の下書きとエラー表示状態 */
export interface AnswerDraft {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => SubmitOutcome;
  error: AnswerFeedbackError | null;
  dismissError: () => void;
}

export interface AfterAnswer {
  /** 回答後にレイアウトが描画する主ボタン */
  primaryAction: { label: string; onClick: () => void };
  /** 回答後、タイトル行のリングの位置に出す補足 */
  status?: ReactNode;
}

export interface QuizLayoutProps {
  modeLabel: string;
  heading: ReactNode;
  round: RoundState;
  actions: Pick<QuizActions, "reveal" | "giveUp">;
  answer: AnswerDraft;
  afterAnswer: AfterAnswer;
  /** この画面で今回答したとき true。結果の演出を一度だけ出す。完了済みの再表示や途中復元では false */
  justAnswered: boolean;
  /** 問題の開始時に開示/諦めボタンへフォーカスするか。最初の問題では false */
  focusHintOnStart: boolean;
  /** 回答確定後にフォーカスする主ボタン。QuizBody が flushSync の直後に読むので、レイアウトをまたいで QuizBody が持つ */
  primaryButtonRef: RefObject<HTMLButtonElement | null>;
}
