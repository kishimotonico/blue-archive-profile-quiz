import { useRef } from "react";
import { flushSync } from "react-dom";
import { getRoundView } from "../../quiz-core";
import Button from "../common/Button";
import HintList from "./HintList";
import QuizPlayArea from "./QuizPlayArea";
import QuizTitleRow from "./QuizTitleRow";
import StudentPortrait from "./StudentPortrait";
import StudentReveal from "./StudentReveal";
import type { QuizLayoutProps } from "./quizLayoutTypes";

function DesktopQuizLayout({
  modeLabel,
  heading,
  round,
  actions,
  answer,
  afterAnswer,
  primaryButtonRef,
}: QuizLayoutProps) {
  const justRevealedHintRef = useRef<HTMLDivElement>(null);

  const { student, answered, correct, score, portraitState, visibleHintCount, nextStep } =
    getRoundView(round);

  // flushSync で DOM を確定させないと、開示前の状態を基準に scrollIntoView してしまう
  const handleReveal =
    nextStep === "hint"
      ? () => {
          flushSync(() => actions.reveal());
          justRevealedHintRef.current?.scrollIntoView({ block: "nearest" });
        }
      : actions.reveal;

  const playArea = (
    <QuizPlayArea
      autoFocusHintButton={round.status === "playing"}
      round={round}
      actions={{ reveal: handleReveal, giveUp: actions.giveUp }}
      answer={answer}
    />
  );

  return (
    <div className="flex h-full gap-4 p-4">
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <QuizTitleRow modeLabel={modeLabel} heading={heading} round={round} className="py-1.5" />

        <div className="flex-1 overflow-y-auto min-h-0">
          <HintList
            hints={round.question.hints}
            visibleCount={visibleHintCount}
            animateReveal={round.status === "playing"}
            layout="desktop"
            justRevealedRef={justRevealedHintRef}
          />
        </div>
      </div>

      <aside className="flex w-[380px] xl:w-[420px] shrink-0 flex-col gap-3 min-h-0">
        <StudentPortrait student={student} state={portraitState} correct={correct} />
        {/* 両方を同じグリッドセルに重ね、常に mount して invisible だけで切り替える（片方を unmount すると回答前後で高さが揃わない） */}
        {/* grid-cols-1とmin-w-0が無いと、内側のw-full要素が親トラック幅を無視して右カラムがはみ出す */}
        <div className="grid grid-cols-1 shrink-0 rounded-2xl border border-ba-border bg-white p-4">
          <div
            className={`col-start-1 row-start-1 flex min-w-0 flex-col justify-center ${answered ? "invisible" : ""}`}
          >
            {playArea}
          </div>
          <div
            className={`col-start-1 row-start-1 flex min-w-0 flex-col justify-center ${
              answered ? "" : "invisible"
            }`}
          >
            <StudentReveal correct={correct} score={score} />
            <div className="mt-2 w-full">
              {afterAnswer.notice}
              <Button
                ref={primaryButtonRef}
                variant="accent"
                className="w-full"
                autoFocus={answered}
                onClick={afterAnswer.primaryAction.onClick}
              >
                {afterAnswer.primaryAction.label}
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default DesktopQuizLayout;
