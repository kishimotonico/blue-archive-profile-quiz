import { type RefObject } from "react";
import Button from "../common/Button";
import AnswerInput from "./AnswerInput";

interface QuizPlayAreaProps {
  hintButtonRef: RefObject<HTMLButtonElement | null>;
  revealedHintCount: number;
  hintsLength: number;
  revealNextHint: () => void;
  submitAnswer: (answer: string) => void;
  giveUp: () => void;
  answerFeedback: string | null;
  errorKey: number;
  /** "footer": 呼び出し側の面（QuizScreenの固定フッター）に載せるため、ここではカードで包まない */
  variant?: "footer" | "panel";
}

function QuizPlayArea({
  hintButtonRef,
  revealedHintCount,
  hintsLength,
  revealNextHint,
  submitAnswer,
  giveUp,
  answerFeedback,
  errorKey,
  variant = "panel",
}: QuizPlayAreaProps) {
  // 開示ボタンを先に置き、Tab順が「開示 → 生徒名入力 → 回答する」になるようにしている
  const hintButton =
    revealedHintCount < hintsLength ? (
      <Button ref={hintButtonRef} onClick={revealNextHint} variant="primary" className="w-full">
        次のヒントを開示
      </Button>
    ) : revealedHintCount === hintsLength ? (
      <Button ref={hintButtonRef} onClick={revealNextHint} variant="primary" className="w-full">
        シルエットを表示
      </Button>
    ) : (
      <Button ref={hintButtonRef} onClick={giveUp} variant="secondary" className="w-full">
        諦めて正解を表示
      </Button>
    );

  const content = (
    <div className="flex flex-col items-stretch gap-3">
      {hintButton}
      <AnswerInput onSubmit={submitAnswer} error={answerFeedback} errorKey={errorKey} />
    </div>
  );

  if (variant === "footer") {
    return content;
  }

  return (
    <div className="shrink-0 flex flex-col justify-center rounded-2xl border border-ba-border bg-white p-3.5 sm:p-4">
      {content}
    </div>
  );
}

export default QuizPlayArea;
