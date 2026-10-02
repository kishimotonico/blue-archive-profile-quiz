import { getNextStep, type RoundState } from "../../quiz-core";
import Button from "../common/Button";
import AnswerInput from "./AnswerInput";
import type { AnswerDraft } from "./quizLayoutTypes";

interface QuizPlayAreaProps {
  round: RoundState;
  /** マウント時に開示/諦めボタンへフォーカスするか */
  autoFocusHintButton?: boolean;
  actions: { reveal: () => void; giveUp: () => void };
  answer: AnswerDraft;
}

function QuizPlayArea({ round, autoFocusHintButton = false, actions, answer }: QuizPlayAreaProps) {
  const nextStep = getNextStep(round);
  // 入力があると「回答する」が accent になるので、強調ボタンを1つに保つため開示ボタンを secondary に下げる
  const isAnswerEmpty = !answer.value.trim();

  // 開示ボタンを先に置き、Tab 順を「開示 → 入力 → 回答する」にする。回答済み（nextStep === null）でも
  // ボタンを残すのは、この面を mount したまま invisible で切り替えるレイアウトの高さを揃えるため
  const hintButton =
    nextStep === "hint" || nextStep === "silhouette" ? (
      <Button
        onClick={actions.reveal}
        variant={isAnswerEmpty ? "primary" : "secondary"}
        className="w-full"
        autoFocus={autoFocusHintButton}
      >
        {nextStep === "hint" ? "次のヒントを開示" : "シルエットを表示"}
      </Button>
    ) : nextStep === "giveUp" ? (
      <Button
        onClick={actions.giveUp}
        variant="secondary"
        className="w-full"
        autoFocus={autoFocusHintButton}
      >
        諦めて正解を表示
      </Button>
    ) : (
      <Button variant="secondary" className="w-full">
        諦めて正解を表示
      </Button>
    );

  return (
    <div className="flex flex-col items-stretch gap-3">
      {hintButton}
      <AnswerInput
        value={answer.value}
        onChange={answer.onChange}
        onSubmit={answer.onSubmit}
        error={answer.error}
        onDismissError={answer.dismissError}
      />
    </div>
  );
}

export default QuizPlayArea;
