import { useRef, type ReactNode, type RefObject } from "react";
import { flushSync } from "react-dom";
import { getRoundView, type Student } from "../../quiz-core";
import Button from "../common/Button";
import HintList from "./HintList";
import MobilePortraitCard from "./MobilePortraitCard";
import QuizPlayArea from "./QuizPlayArea";
import QuizTitleRow from "./QuizTitleRow";
import type { AfterAnswer, QuizLayoutProps } from "./quizLayoutTypes";

interface FooterFaceProps {
  playArea: ReactNode;
}

// -mx-4 -mb-4 は main の余白を打ち消して画面端まで白い面にするため
function FooterFace({ playArea }: FooterFaceProps) {
  return (
    <div className="min-w-0 -mx-4 -mb-4 border-t border-ba-border bg-white px-4 py-3">
      {playArea}
    </div>
  );
}

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
    <div className="min-w-0 flex flex-col items-stretch gap-3 py-3">
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

// lg（1024px）未満。立ち絵はヒント一覧の下に表示し、回答欄は画面下部に固定する
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

  // flushSyncで確定させないと、枠がまだ縮んだままのDOMを基準にscrollIntoViewしてしまう
  const scrollPortraitIntoView = () => {
    portraitRef.current?.scrollIntoView({ block: "end" });
  };
  const willExpandOnReveal = portraitState === "hidden" && nextStep === "silhouette";

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
      variant="footer"
      autoFocusHintButton={round.status === "playing"}
      round={round}
      actions={{ reveal: handleReveal, giveUp: actions.giveUp }}
      answer={{ ...answer, onSubmit: handleSubmit }}
    />
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      <QuizTitleRow modeLabel={modeLabel} heading={heading} round={round} />

      {/* container-type:sizeは、立ち絵枠の展開後の高さ上限（MobilePortraitCard）がcqhで参照できるように */}
      <div className="flex-1 overflow-y-auto min-h-0 [container-type:size] scroll-smooth motion-reduce:scroll-auto">
        <div className="flex flex-col gap-2 pb-4">
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

      {/* 回答前後で操作エリアの高さを揃えてあるため（RevealedFace参照）、両方を同じ
          グリッドセルに重ねて描画するだけで答え合わせの前後で高さが変わらない */}
      <div className="shrink-0 grid" data-quiz-footer-area>
        <div className={`[grid-area:1/1] ${answered ? "invisible" : ""}`} inert={answered}>
          <FooterFace playArea={playArea} />
        </div>
        <div className={`[grid-area:1/1] ${!answered ? "invisible" : ""}`} inert={!answered}>
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
