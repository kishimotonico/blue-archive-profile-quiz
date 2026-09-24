import { getTotalStages, type RoundState } from "../../quiz-core";

/**
 * QuizScreen の props（個別の answered/correct/score 形式）へ橋渡しするための暫定変換。
 * QuizScreen 自体をステップ4で RoundState ベースの props に作り直すまでの間だけ使う。
 */
export function toQuizScreenRoundProps(round: RoundState) {
  const { question } = round;
  return round.status === "playing"
    ? {
        student: question.student,
        hints: question.hints,
        revealedHintCount: round.revealedHintCount,
        answered: false as const,
        correct: false,
        score: 0,
      }
    : {
        student: question.student,
        hints: question.hints,
        // QuizScreen の既存の意味（回答済みは全ヒント表示）に合わせる。得点の記録は
        // round.result.score が持つので、表示範囲を変えても再計算にはならない。
        revealedHintCount: getTotalStages(round),
        answered: true as const,
        correct: round.result.correct,
        score: round.result.score,
      };
}
