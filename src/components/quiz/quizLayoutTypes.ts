import type { ReactNode, RefObject } from "react";
import type { RoundState, SubmitOutcome } from "../../quiz-core";

/** ページ → QuizScreen の操作。submit はページ〜QuizBodyの境界だけで使い、各レイアウトへは渡さない */
export interface QuizActions {
  reveal: () => void;
  submit: (answer: string) => SubmitOutcome;
  giveUp: () => void;
}

/** 回答欄のエラー表示。message・attempt は QuizBody が submit の結果から作る。
 * attempt は同じ文言が続いても吹き出し・シェイクを出し直すための識別値 */
export interface AnswerFeedbackError {
  message: string;
  attempt: number;
}

/** QuizBody が持つ回答欄の下書きとエラー表示状態。AnswerInput を controlled にするための橋渡し */
export interface AnswerDraft {
  value: string;
  onChange: (value: string) => void;
  /** 送信結果を返す。unknownStudent のときだけ AnswerInput がシェイクを再生する */
  onSubmit: () => SubmitOutcome;
  error: AnswerFeedbackError | null;
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
  /** 回答確定後にフォーカスする主ボタンの ref。QuizBody が flushSync の直後に読むため、
   * レイアウトをまたいでも同じ ref を使えるよう QuizBody が持つ */
  primaryButtonRef: RefObject<HTMLButtonElement | null>;
  /** この問題で最初に描画されたときだけ true。画面幅の変化でレイアウトが
   * Desktop/Mobile 間で切り替わっても再マウントの起点にならないよう、questionId ごとに
   * 1回だけ立つ QuizBody 側の値を渡す */
  autoFocusOnMount: boolean;
}
