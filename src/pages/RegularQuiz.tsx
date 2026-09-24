import { useEffect, useRef } from "react";
import { useRegularQuiz } from "../hooks/useRegularQuiz";
import Button from "../components/common/Button";
import { useIsAnyDialogOpen } from "../components/common/dialogRegistry";
import QuizLoadingState from "../components/quiz/QuizLoadingState";
import QuizErrorState from "../components/quiz/QuizErrorState";
import QuizScreen from "../components/quiz/QuizScreen";

function RegularQuiz() {
  const {
    currentQuestion,
    revealedHintCount,
    answered,
    correct,
    score,
    answerFeedback,
    errorKey,
    revealNextHint,
    submitAnswer,
    giveUp,
    loading,
    currentQuestionIndex,
    totalScore,
    goNext,
    TOTAL_QUESTIONS,
  } = useRegularQuiz();

  const hintButtonRef = useRef<HTMLButtonElement>(null);
  const isAnyDialogOpen = useIsAnyDialogOpen();

  // 問題切替時にヒントボタンにフォーカス
  useEffect(() => {
    if (!loading && !answered && hintButtonRef.current) {
      hintButtonRef.current.focus();
    }
  }, [loading, answered, currentQuestionIndex]);

  // 回答後、Enterキーで次の問題へ
  useEffect(() => {
    if (!answered) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      // モーダル表示中は、モーダル内操作としてのEnterを次の問題への遷移と誤認しないようにする
      if (isAnyDialogOpen) return;
      e.preventDefault();
      e.stopPropagation();
      goNext();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [answered, goNext, isAnyDialogOpen]);

  if (loading) return <QuizLoadingState />;
  if (!currentQuestion) return <QuizErrorState />;

  return (
    <QuizScreen
      modeLabel={`フリープレイ・合計 ${totalScore}点`}
      heading={`${currentQuestionIndex + 1} / ${TOTAL_QUESTIONS} 問目`}
      student={currentQuestion.student}
      hints={currentQuestion.hints}
      revealedHintCount={revealedHintCount}
      answered={answered}
      correct={correct}
      score={score}
      hintButtonRef={hintButtonRef}
      revealNextHint={revealNextHint}
      submitAnswer={submitAnswer}
      giveUp={giveUp}
      answerFeedback={answerFeedback}
      errorKey={errorKey}
      scrollResetKey={currentQuestionIndex}
      afterAnswerActions={
        <Button onClick={goNext} variant="primary" className="w-full">
          {currentQuestionIndex + 1 < TOTAL_QUESTIONS ? "次の問題へ" : "結果を見る"}
        </Button>
      }
    />
  );
}

export default RegularQuiz;
