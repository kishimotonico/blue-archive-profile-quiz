import { useEffect, useRef, useCallback } from "react";
import { useRegularQuiz } from "../hooks/useRegularQuiz";
import Button from "../components/common/Button";
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

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hintButtonRef = useRef<HTMLButtonElement>(null);

  // 問題切替時にヒントボタンにフォーカス
  useEffect(() => {
    if (!loading && !answered && hintButtonRef.current) {
      hintButtonRef.current.focus();
    }
  }, [loading, answered, currentQuestionIndex]);

  const handleNext = useCallback(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "instant" });
    goNext();
  }, [goNext]);

  // 回答後、Enterキーで次の問題へ
  useEffect(() => {
    if (!answered) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        handleNext();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [answered, handleNext]);

  if (loading) return <QuizLoadingState />;
  if (!currentQuestion) return <QuizErrorState />;

  return (
    <QuizScreen
      modeLabel="FREE PLAY"
      heading={`${currentQuestionIndex + 1} / ${TOTAL_QUESTIONS} 問目・合計 ${totalScore}点`}
      student={currentQuestion.student}
      hints={currentQuestion.hints}
      revealedHintCount={revealedHintCount}
      answered={answered}
      correct={correct}
      score={score}
      scrollContainerRef={scrollContainerRef}
      hintButtonRef={hintButtonRef}
      revealNextHint={revealNextHint}
      submitAnswer={submitAnswer}
      giveUp={giveUp}
      answerFeedback={answerFeedback}
      errorKey={errorKey}
      showMobileFooter={!answered}
      renderAfterAnswerActions={(isDesktop) => (
        <Button
          onClick={handleNext}
          variant="primary"
          className={isDesktop ? "mt-2 w-full" : undefined}
        >
          {currentQuestionIndex + 1 < TOTAL_QUESTIONS ? "次の問題へ" : "結果を見る"}
        </Button>
      )}
    />
  );
}

export default RegularQuiz;
