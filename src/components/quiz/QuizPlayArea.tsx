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
  answered: boolean;
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
  answered,
}: QuizPlayAreaProps) {
  if (answered) return null;

  return (
    <div className="rounded-2xl border border-ba-border bg-white p-3.5 shadow-xs sm:p-4">
      <div className="ba-tag mb-3">
        <span>ANSWER</span>
      </div>
      <div className="flex flex-col items-stretch gap-3">
        <AnswerInput onSubmit={submitAnswer} error={answerFeedback} errorKey={errorKey} />

        {revealedHintCount < hintsLength ? (
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
        )}
      </div>
    </div>
  );
}

export default QuizPlayArea;
