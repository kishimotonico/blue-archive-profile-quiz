import { useRef, type RefObject } from "react";
import { flushSync } from "react-dom";
import { getPlayerRevealedHintCount, getRoundView, type RoundState } from "../../quiz-core";
import Button from "../common/Button";
import HintList from "./HintList";
import MobilePortraitCard from "./MobilePortraitCard";
import QuizPlayArea from "./QuizPlayArea";
import QuizTitleRow from "./QuizTitleRow";
import RoundResultSummary from "./RoundResultSummary";
import type { AfterAnswer, QuizLayoutProps } from "./quizLayoutTypes";

interface RevealedFaceProps {
  round: RoundState;
  afterAnswer: AfterAnswer;
  justAnswered: boolean;
  primaryButtonRef: RefObject<HTMLButtonElement | null>;
}

// 回答前の操作エリア（ボタン1段＋入力欄1段）と高さを揃えるため、要約の高さと gap を入力欄に合わせる
function RevealedFace({ round, afterAnswer, justAnswered, primaryButtonRef }: RevealedFaceProps) {
  return (
    <div className="min-w-0 flex flex-col items-stretch gap-3">
      <div className="flex h-[52px] min-w-0 items-center">
        <RoundResultSummary round={round} justAnswered={justAnswered} />
      </div>
      <Button
        ref={primaryButtonRef}
        variant="accent"
        className="w-full"
        onClick={afterAnswer.primaryAction.onClick}
      >
        {afterAnswer.primaryAction.label}
      </Button>
    </div>
  );
}

function MobileQuizLayout({
  modeLabel,
  heading,
  round,
  actions,
  answer,
  afterAnswer,
  justAnswered,
  focusHintOnStart,
  primaryButtonRef,
}: QuizLayoutProps) {
  const portraitRef = useRef<HTMLDivElement>(null);
  const justRevealedHintRef = useRef<HTMLDivElement>(null);

  const { student, answered, correct, portraitState, visibleHintCount, nextStep } =
    getRoundView(round);

  const scrollPortraitIntoView = () => {
    portraitRef.current?.scrollIntoView({ block: "end" });
  };

  // flushSync で DOM を確定させないと、開示前（枠が縮んだまま）を基準にスクロールしてしまう
  const handleReveal = () => {
    if (portraitState === "hidden" && nextStep === "silhouette") {
      flushSync(() => actions.reveal());
      scrollPortraitIntoView();
    } else if (nextStep === "hint") {
      flushSync(() => actions.reveal());
      justRevealedHintRef.current?.scrollIntoView({ block: "center" });
    } else {
      actions.reveal();
    }
  };

  // unknownStudent では回答が確定せず枠も動かないため、確定した場合だけスクロールする
  const handleSubmit = () => {
    const outcome = answer.onSubmit();
    if (outcome === "accepted" && portraitState === "hidden") scrollPortraitIntoView();
    return outcome;
  };

  const playArea = (
    <QuizPlayArea
      autoFocusHintButton={focusHintOnStart && round.status === "playing"}
      round={round}
      actions={{ reveal: handleReveal, giveUp: actions.giveUp }}
      answer={{ ...answer, onSubmit: handleSubmit }}
    />
  );

  return (
    <div className="flex h-full flex-col">
      <QuizTitleRow
        modeLabel={modeLabel}
        heading={heading}
        round={round}
        status={afterAnswer.status}
        className="px-4 pt-5 pb-3"
      />

      {/* スクロール領域を絶対配置にするのは、MobilePortraitCard の cqh を祖先 flex の内在サイズに
          左右させないため。flex アイテムのままだと Chrome では 0 に解決される */}
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 overflow-y-auto [container-type:size] scroll-smooth motion-reduce:scroll-auto">
          <div className="flex flex-col gap-2 px-4 pb-4">
            <HintList
              hints={round.question.hints}
              visibleCount={visibleHintCount}
              playerRevealedCount={getPlayerRevealedHintCount(round)}
              animateReveal={round.status === "playing"}
              layout="mobile"
              justRevealedRef={justRevealedHintRef}
            />
            <MobilePortraitCard
              student={student}
              portraitState={portraitState}
              correct={correct}
              containerRef={portraitRef}
            />
          </div>
        </div>
      </div>

      {/* 回答前後の面を同じグリッドセルに重ね、invisible で切り替えて高さを揃える。min-w-0 が無いと
          列が中身の最小幅まで広がって右にはみ出す */}
      <div className="shrink-0 grid border-t border-ba-border bg-white px-4 py-3">
        <div className={`col-start-1 row-start-1 min-w-0 ${answered ? "invisible" : ""}`}>
          {playArea}
        </div>
        <div className={`col-start-1 row-start-1 min-w-0 ${answered ? "" : "invisible"}`}>
          <RevealedFace
            round={round}
            afterAnswer={afterAnswer}
            justAnswered={justAnswered}
            primaryButtonRef={primaryButtonRef}
          />
        </div>
      </div>
    </div>
  );
}

export default MobileQuizLayout;
