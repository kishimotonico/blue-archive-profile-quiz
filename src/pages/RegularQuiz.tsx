import { useRegularQuiz } from "../hooks/useRegularQuiz";
import QuizScreen from "../components/quiz/QuizScreen";

function RegularQuiz() {
  const { view, totalQuestions, reveal, submit, giveUp, next } = useRegularQuiz();

  const currentIndex = view.index;
  return (
    <QuizScreen
      modeLabel={`フリープレイ・合計 ${view.totalScore}点`}
      heading={`${currentIndex + 1} / ${totalQuestions} 問目`}
      questionId={view.questionId}
      round={view.round}
      actions={{ reveal, submit, giveUp }}
      afterAnswer={{
        primaryAction: {
          label: currentIndex + 1 < totalQuestions ? "次の問題へ" : "結果を見る",
          onClick: next,
        },
      }}
    />
  );
}

export default RegularQuiz;
