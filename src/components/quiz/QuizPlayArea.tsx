import { type RefObject } from 'react';
import Button from '../common/Button';
import AnswerInput from './AnswerInput';

interface QuizPlayAreaProps {
  hintButtonRef: RefObject<HTMLButtonElement | null>;
  revealedHintCount: number;
  hintsLength: number;
  revealNextHint: () => void;
  submitAnswer: (answer: string) => void;
  giveUp: () => void;
  answerFeedback: string | null;
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
  answered,
}: QuizPlayAreaProps) {
  if (answered) return null;

  return (
    <div className="flex flex-col items-stretch gap-3 max-w-xs mx-auto">
      {revealedHintCount < hintsLength ? (
        <Button ref={hintButtonRef} onClick={revealNextHint} variant="secondary" className="w-full">
          次のヒントを開示
        </Button>
      ) : revealedHintCount === hintsLength ? (
        <Button ref={hintButtonRef} onClick={revealNextHint} variant="secondary" className="w-full">
          シルエットを表示
        </Button>
      ) : (
        <Button ref={hintButtonRef} onClick={giveUp} variant="danger" className="w-full">
          諦めて正解を表示
        </Button>
      )}

      <AnswerInput onSubmit={submitAnswer} />

      {answerFeedback && (
        <p className="text-red-500 text-sm font-semibold text-center">{answerFeedback}</p>
      )}
    </div>
  );
}

export default QuizPlayArea;
