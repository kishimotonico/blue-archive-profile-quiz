import { getPortraitState, getVisibleHintCount } from "../../quiz-core";
import Button from "../common/Button";
import HintList from "./HintList";
import QuizPlayArea from "./QuizPlayArea";
import QuizTitleRow from "./QuizTitleRow";
import StudentPortrait from "./StudentPortrait";
import StudentReveal from "./StudentReveal";
import type { QuizLayoutProps } from "./quizLayoutTypes";

// lg（1024px）以上。立ち絵は右カラムに大きく表示し、ヒント一覧は左カラムに2列で並べる
function DesktopQuizLayout({
  modeLabel,
  heading,
  round,
  actions,
  answer,
  afterAnswer,
  primaryButtonRef,
  autoFocusOnMount,
}: QuizLayoutProps) {
  const { student } = round.question;
  const answered = round.status === "answered";
  const correct = answered && round.result.correct;
  const score = answered ? round.result.score : 0;
  const portraitState = getPortraitState(round);
  const visibleHintCount = getVisibleHintCount(round);

  const playArea = (
    <QuizPlayArea
      variant="panel"
      // autoFocusOnMount は問題ごとに1回だけ立つ（QuizBody参照）ため、画面幅が lg を
      // またいでレイアウトが再マウントされてもフォーカスは飛ばない
      autoFocusHintButton={autoFocusOnMount && round.status === "playing"}
      round={round}
      actions={actions}
      answer={answer}
    />
  );

  return (
    <>
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <QuizTitleRow modeLabel={modeLabel} heading={heading} round={round} />

        <div className="flex-1 overflow-y-auto min-h-0">
          <HintList
            hints={round.question.hints}
            visibleCount={visibleHintCount}
            animateReveal={round.status === "playing"}
            layout="desktop"
          />
        </div>
      </div>

      <aside className="flex w-[380px] xl:w-[420px] shrink-0 flex-col gap-3 min-h-0">
        <StudentPortrait student={student} state={portraitState} correct={correct} />
        {/* 両方のセルを同じグリッドセルに重ねて、大きい方の高さにセルを揃える。
            実測値の min-height に頼らず、回答前後で立ち絵パネルの高さが変わらないようにする */}
        {/* grid-cols-1とmin-w-0が無いと、グリッドアイテムのデフォルトmin-width:autoにより
            内側のw-full要素の幅が親のトラック幅を無視して広がり、右カラムがはみ出す */}
        <div className="grid grid-cols-1 shrink-0">
          <div
            className={`col-start-1 row-start-1 min-w-0 ${answered ? "invisible" : ""}`}
            inert={answered}
          >
            {playArea}
          </div>
          {/* answered と同時に一方だけ mount/unmount すると、mount されていない側の
              高さがグリッド行の計算に加わらず、回答前後で立ち絵パネルの高さが変わってしまう。
              常に両方 mount し、invisible/inert だけで切り替える */}
          <div
            className={`col-start-1 row-start-1 flex min-w-0 flex-col justify-center rounded-2xl border border-ba-border bg-white p-3.5 ${
              answered ? "" : "invisible"
            }`}
            inert={!answered}
          >
            <StudentReveal student={student} correct={correct} score={score} showName={false} />
            <div className="mt-2 w-full">
              {afterAnswer.notice}
              <Button
                ref={primaryButtonRef}
                variant="accent"
                className="w-full"
                autoFocus={autoFocusOnMount && answered}
                onClick={afterAnswer.primaryAction.onClick}
              >
                {afterAnswer.primaryAction.label}
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default DesktopQuizLayout;
