import { getNextStep, type RoundState } from "../../quiz-core";
import Button from "../common/Button";
import AnswerInput from "./AnswerInput";
import type { AnswerDraft } from "./quizLayoutTypes";

interface QuizPlayAreaProps {
  round: RoundState;
  /** マウント時に開示/諦めボタンへ自動的にフォーカスするか（問題ごとに1回だけ） */
  autoFocusHintButton?: boolean;
  actions: { reveal: () => void; giveUp: () => void };
  answer: AnswerDraft;
}

function QuizPlayArea({ round, autoFocusHintButton = false, actions, answer }: QuizPlayAreaProps) {
  const nextStep = getNextStep(round);
  // 画面内の強調ボタン（primary/accent）は常に1つまでにする。回答欄に入力があると
  // 「回答する」が accent になるため、その間は開示ボタンを secondary に下げる
  const isAnswerEmpty = !answer.value.trim();

  // 開示ボタンを先に置き、Tab順が「開示 → 生徒名入力 → 回答する」になるようにしている。
  // 回答済み（nextStep === null）でもボタン自体は invisible で残し、枠を消す。desktop の立ち絵パネルは
  // このコンポーネントを常に mount したまま invisible で切り替えるため、ボタンの有無で高さが
  // 変わると立ち絵パネルの高さも一緒に変わってしまう
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
      <Button variant="secondary" className="w-full invisible">
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
