import type { ReactNode } from "react";
import type { RoundState, SubmitOutcome } from "../../quiz-core";

/** controller の answerFeedback/errorKey をそのまま渡す。key はエラー吹き出しの再生トリガー */
export interface AnswerError {
  message: string | null;
  key: number;
}

/** ページ → QuizScreen の操作。submit はページ〜QuizBodyの境界だけで使い、各レイアウトへは渡さない */
export interface QuizActions {
  reveal: () => void;
  submit: (answer: string) => SubmitOutcome;
  giveUp: () => void;
}

/** QuizBody が持つ回答欄の下書きとエラー表示状態。AnswerInput を controlled にするための橋渡し */
export interface AnswerDraft {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  error: AnswerError;
  /** エラー吹き出し・入力欄の赤枠を表示するか。入力や時間経過でQuizBody側が閉じる */
  errorVisible: boolean;
  dismissError: () => void;
}

/** 回答後にレイアウトが描画する主ボタンと、その上に出す補足 */
export interface AfterAnswer {
  primaryAction: { label: string; onClick: () => void };
  notice?: ReactNode;
}

/** QuizBody → 各レイアウトへ渡す共通 props */
export interface QuizLayoutProps {
  modeLabel: string;
  heading: ReactNode;
  round: RoundState;
  actions: { reveal: () => void; giveUp: () => void };
  answer: AnswerDraft;
  afterAnswer: AfterAnswer;
}
