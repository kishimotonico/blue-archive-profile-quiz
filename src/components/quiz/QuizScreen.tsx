import type { ReactNode } from "react";
import type { RoundState } from "../../quiz-core";
import Header from "../layout/Header";
import QuizBody from "./QuizBody";
import type { AfterAnswer, QuizActions } from "./quizLayoutTypes";

interface QuizScreenProps {
  modeLabel: string;
  heading: ReactNode;
  /** 問題を一意に識別する値。変化すると下書き・エラー表示・演出状態を作り直す */
  questionId: string;
  round: RoundState;
  actions: QuizActions;
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
  afterAnswer,
}: QuizScreenProps) {
  return (
    <div className="h-[100dvh] flex flex-col">
      <Header />

      {/* overflow-hidden だと main もスクロールコンテナになり、立ち絵の scrollIntoView が main まで
          動かして位置がずれるため overflow-clip にする。その場合 min-h-0 がないと flex の最小高さが
          中身の高さになり画面からはみ出す */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 p-4 pt-2 md:pt-4 max-w-6xl xl:max-w-7xl mx-auto w-full overflow-clip">
        <QuizBody
          key={questionId}
          modeLabel={modeLabel}
          heading={heading}
          round={round}
          actions={actions}
          afterAnswer={afterAnswer}
        />
      </main>
    </div>
  );
}

export default QuizScreen;
