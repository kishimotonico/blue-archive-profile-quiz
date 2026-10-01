import { useRef, type RefObject } from "react";
import { flushSync } from "react-dom";
import { getRoundView, type Student } from "../../quiz-core";
import Button from "../common/Button";
import HintList from "./HintList";
import MobilePortraitCard from "./MobilePortraitCard";
import QuizPlayArea from "./QuizPlayArea";
import QuizTitleRow from "./QuizTitleRow";
import type { AfterAnswer, QuizLayoutProps } from "./quizLayoutTypes";

interface RevealedFaceProps {
  student: Student;
  correct: boolean;
  score: number;
  afterAnswer: AfterAnswer;
  autoFocus: boolean;
  primaryButtonRef: RefObject<HTMLButtonElement | null>;
}

// 回答前の操作エリア（開示ボタン1段＋入力欄1段）と高さを揃えるため、結果表示もボタンと
// 同じ箱に収めて主ボタンと合わせて2段にしている
function RevealedFace({
  student,
  correct,
  score,
  afterAnswer,
  autoFocus,
  primaryButtonRef,
}: RevealedFaceProps) {
  return (
    <div className="min-w-0 flex flex-col items-stretch gap-3">
      {afterAnswer.notice}
      <div className="flex min-w-0 items-center justify-center gap-2 rounded-lg border-2 border-transparent px-4 py-3 text-base">
        <span
          className={`shrink-0 font-display font-black ${correct ? "text-ba-correct" : "text-ba-wrong"}`}
        >
          {correct ? "正解！" : "不正解..."}
        </span>
        <span className="shrink-0 inline-flex items-baseline gap-1 rounded-full border border-ba-yellow-soft bg-linear-to-b from-ba-yellow-soft/40 to-ba-yellow/60 px-2.5 py-0.5 text-ba-navy">
          <span className="text-sm font-bold">{score}</span>
          <span className="text-[10px] font-bold">点</span>
        </span>
        <span className="min-w-0 flex-1 truncate text-left font-display font-black text-ba-navy">
          {student.fullName}
        </span>
      </div>
      <Button
        ref={primaryButtonRef}
        variant="accent"
        className="w-full"
        autoFocus={autoFocus}
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
  primaryButtonRef,
}: QuizLayoutProps) {
  const portraitRef = useRef<HTMLDivElement>(null);
  const justRevealedHintRef = useRef<HTMLDivElement>(null);

  const { student, answered, correct, score, portraitState, visibleHintCount, nextStep } =
    getRoundView(round);

  const scrollPortraitIntoView = () => {
    portraitRef.current?.scrollIntoView({ block: "end" });
  };
  const willExpandOnReveal = portraitState === "hidden" && nextStep === "silhouette";

  // flushSync で DOM を確定させないと、枠が縮んだままの状態を基準に scrollIntoView してしまう
  const handleReveal = (() => {
    if (willExpandOnReveal) {
      return () => {
        flushSync(() => actions.reveal());
        scrollPortraitIntoView();
      };
    }
    if (nextStep === "hint") {
      return () => {
        flushSync(() => actions.reveal());
        justRevealedHintRef.current?.scrollIntoView({ block: "center" });
      };
    }
    return actions.reveal;
  })();

  // unknownStudent（回答欄のエラー）では回答が確定せず枠も動かないため、
  // 確定した場合だけスクロールする
  const willExpandOnSubmit = portraitState === "hidden";
  const handleSubmit = willExpandOnSubmit
    ? () => {
        const outcome = answer.onSubmit();
        if (outcome === "accepted") scrollPortraitIntoView();
        return outcome;
      }
    : answer.onSubmit;

  const playArea = (
    <QuizPlayArea
      autoFocusHintButton={round.status === "playing"}
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
        className="px-4 pt-5 pb-3 md:pt-5.5 md:pb-1.5"
      />

      {/* スクロール領域を絶対配置にするのは、立ち絵枠の高さ上限（MobilePortraitCard の cqh）の解決を
          祖先の flex の内在サイズ計算に左右させないため。Chrome では flex アイテムのままだと 0 に解決される */}
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 overflow-y-auto [container-type:size] scroll-smooth motion-reduce:scroll-auto">
          <div className="flex flex-col gap-2 px-4 pb-4">
            <HintList
              hints={round.question.hints}
              visibleCount={visibleHintCount}
              animateReveal={round.status === "playing"}
              layout="mobile"
              justRevealedRef={justRevealedHintRef}
            />
            <MobilePortraitCard
              student={student}
              portraitState={portraitState}
              containerRef={portraitRef}
            />
          </div>
        </div>
      </div>

      {/* 回答前後で操作エリアの高さを揃えてあるため（RevealedFace参照）、両方を同じ
          グリッドセルに重ねて描画するだけで答え合わせの前後で高さが変わらない。
          各セルの min-w-0 は、無いとグリッドの列が中身の最小幅まで広がって右にはみ出すため */}
      <div className="shrink-0 grid border-t border-ba-border bg-white px-4 py-3">
        <div
          className={`col-start-1 row-start-1 min-w-0 ${answered ? "invisible" : ""}`}
          inert={answered}
        >
          {playArea}
        </div>
        <div
          className={`col-start-1 row-start-1 min-w-0 ${!answered ? "invisible" : ""}`}
          inert={!answered}
        >
          <RevealedFace
            student={student}
            correct={correct}
            score={score}
            afterAnswer={afterAnswer}
            autoFocus={answered}
            primaryButtonRef={primaryButtonRef}
          />
        </div>
      </div>
    </div>
  );
}

export default MobileQuizLayout;
