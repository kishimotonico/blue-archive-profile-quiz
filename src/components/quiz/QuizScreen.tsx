import { useState, type ReactNode } from "react";
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

function QuizScreen({
  modeLabel,
  heading,
  questionId,
  round,
  actions,
  afterAnswer,
}: QuizScreenProps) {
  // 最初の問題だけ autoFocus しない。開いただけでフォーカス枠が出るため。2問目以降は Enter だけで続けられる
  const [initialQuestionId] = useState(questionId);
  return (
    // overflow-hidden だと main がスクロールコンテナになり、scrollIntoView が main まで動かしてしまう
    <main className="h-[calc(100dvh-var(--header-height))] max-w-6xl xl:max-w-7xl mx-auto w-full overflow-clip">
      <QuizBody
        key={questionId}
        modeLabel={modeLabel}
        heading={heading}
        round={round}
        actions={actions}
        afterAnswer={afterAnswer}
        focusHintOnStart={questionId !== initialQuestionId}
      />
    </main>
  );
}

export default QuizScreen;
