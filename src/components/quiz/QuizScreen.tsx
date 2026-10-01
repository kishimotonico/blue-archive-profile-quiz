import type { ReactNode } from "react";
import type { RoundState } from "../../quiz-core";
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
    // overflow-hidden だと main もスクロールコンテナになり、立ち絵の scrollIntoView が main まで
    // 動かして位置がずれるため overflow-clip にする
    <main className="h-[calc(100dvh-var(--header-height))] max-w-6xl xl:max-w-7xl mx-auto w-full overflow-clip">
      <QuizBody
        key={questionId}
        modeLabel={modeLabel}
        heading={heading}
        round={round}
        actions={actions}
        afterAnswer={afterAnswer}
      />
    </main>
  );
}

export default QuizScreen;
