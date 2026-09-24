import type { ReactNode } from "react";
import type { RoundState } from "../../quiz-core";
import Header from "../layout/Header";
import QuizBody from "./QuizBody";
import type { AfterAnswer, AnswerError, QuizActions } from "./quizLayoutTypes";

interface QuizScreenProps {
  modeLabel: string;
  heading: ReactNode;
  /** 問題を一意に識別する値。変化すると下書き・エラー表示・演出状態を作り直す */
  questionId: string;
  round: RoundState;
  actions: QuizActions;
  answerError: AnswerError;
  afterAnswer: AfterAnswer;
}

// 日替わりクイズ・フリープレイで共通のレイアウトのみを持つ。
// 結果モーダルや初期化・進捗保存などページ固有のロジックは呼び出し側に残す。
function QuizScreen({
  modeLabel,
  heading,
  questionId,
  round,
  actions,
  answerError,
  afterAnswer,
}: QuizScreenProps) {
  return (
    <div className="h-[100dvh] flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 pt-2 md:pt-4 max-w-6xl xl:max-w-7xl mx-auto w-full overflow-hidden">
        {/* 問題が変わるたびに下書き・エラー表示・開示演出の状態を作り直す。
            画面幅が変わってモバイル/デスクトップのレイアウトが切り替わっても、
            questionId は変わらないため QuizBody は作り直されず下書きが残る */}
        <QuizBody
          key={questionId}
          modeLabel={modeLabel}
          heading={heading}
          round={round}
          actions={actions}
          answerError={answerError}
          afterAnswer={afterAnswer}
        />
      </main>
    </div>
  );
}

export default QuizScreen;
