import { useEffect } from "react";
import { useRegularQuiz } from "../hooks/useRegularQuiz";
import Button from "../components/common/Button";
import { useIsAnyDialogOpen } from "../components/common/dialogRegistry";
import QuizLoadingState from "../components/quiz/QuizLoadingState";
import QuizErrorState from "../components/quiz/QuizErrorState";
import QuizScreen from "../components/quiz/QuizScreen";

function RegularQuiz() {
  const {
    state,
    totalQuestions,
    totalScore,
    reveal,
    submit,
    giveUp,
    next,
    answerFeedback,
    errorKey,
  } = useRegularQuiz();

  const isAnyDialogOpen = useIsAnyDialogOpen();

  const answered =
    (state.status === "ready" || state.status === "finished") &&
    state.session.round.status === "answered";

  // 回答後、Enterキーで次の問題へ
  useEffect(() => {
    if (!answered) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      // モーダル表示中は、モーダル内操作としてのEnterを次の問題への遷移と誤認しないようにする
      if (isAnyDialogOpen) return;
      e.preventDefault();
      e.stopPropagation();
      next();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [answered, next, isAnyDialogOpen]);

  if (state.status === "loading") return <QuizLoadingState />;
  if (state.status === "error") return <QuizErrorState />;

  const { session } = state;
  const currentIndex = session.index;

  return (
    <QuizScreen
      modeLabel={`フリープレイ・合計 ${totalScore}点`}
      heading={`${currentIndex + 1} / ${totalQuestions} 問目`}
      questionId={String(currentIndex)}
      round={session.round}
      actions={{ reveal, submit, giveUp }}
      answerError={{ message: answerFeedback, key: errorKey }}
      afterAnswerActions={
        <Button onClick={next} variant="primary" className="w-full">
          {currentIndex + 1 < totalQuestions ? "次の問題へ" : "結果を見る"}
        </Button>
      }
    />
  );
}

export default RegularQuiz;
