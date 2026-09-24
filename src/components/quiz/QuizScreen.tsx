import { type ReactNode, type RefObject } from "react";
import { useIsDesktop } from "../../hooks/useIsDesktop";
import type { Hint, Student } from "../../quiz-core";
import HaloRingGauge from "../common/HaloRingGauge";
import Header from "../layout/Header";
import HintList from "./HintList";
import QuizPlayArea from "./QuizPlayArea";
import StudentPortrait from "./StudentPortrait";
import StudentReveal from "./StudentReveal";
import { getPortraitState } from "./portraitUtils";

interface QuizScreenProps {
  modeLabel: string;
  heading: ReactNode;
  student: Student;
  hints: Hint[];
  revealedHintCount: number;
  answered: boolean;
  correct: boolean;
  score: number;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  hintButtonRef: RefObject<HTMLButtonElement | null>;
  revealNextHint: () => void;
  submitAnswer: (answer: string) => void;
  giveUp: () => void;
  answerFeedback: string | null;
  errorKey: number;
  /** モバイルとデスクトップで表示位置・スタイルが異なるため isDesktop を渡す */
  renderAfterAnswerActions?: (isDesktop: boolean) => ReactNode;
}

// 日替わりクイズ・フリープレイで共通のレイアウトのみを持つ。
// 結果モーダルや初期化・進捗保存などページ固有のロジックは呼び出し側に残す。
function QuizScreen({
  modeLabel,
  heading,
  student,
  hints,
  revealedHintCount,
  answered,
  correct,
  score,
  scrollContainerRef,
  hintButtonRef,
  revealNextHint,
  submitAnswer,
  giveUp,
  answerFeedback,
  errorKey,
  renderAfterAnswerActions,
}: QuizScreenProps) {
  const isDesktop = useIsDesktop();
  const portraitState = getPortraitState(answered, revealedHintCount, hints.length);
  const totalStages = hints.length + 1; // シルエット表示も1ステージとして数える
  const remainingStages = Math.max(totalStages - revealedHintCount, 0);

  // 回答前後でこのパネルの高さが変わると立ち絵パネルの高さも変わってしまうため、
  // 回答前パネルの実測高さに合わせた min-height を結果パネル側にも同じ値で使う
  const answerPanelMinHeightClass = "min-h-[152px]";

  const playArea = (
    <QuizPlayArea
      variant={isDesktop ? "panel" : "footer"}
      panelClassName={isDesktop ? answerPanelMinHeightClass : ""}
      hintButtonRef={hintButtonRef}
      revealedHintCount={revealedHintCount}
      hintsLength={hints.length}
      revealNextHint={revealNextHint}
      submitAnswer={submitAnswer}
      giveUp={giveUp}
      answerFeedback={answerFeedback}
      errorKey={errorKey}
      answered={answered}
    />
  );

  return (
    <div className="h-[100dvh] flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 pt-2 md:pt-4 max-w-6xl xl:max-w-7xl mx-auto w-full overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* pr-16はモバイル右上固定のハンバーガーボタン（Header側、top-3 right-3, w-11 h-11）と
              ゲージが重ならないための余白。md以上ではハンバーガーが無いので不要 */}
          <div className="shrink-0 flex items-center justify-between gap-3 py-3 pr-16 md:py-1.5 md:pr-0">
            <div className="min-w-0 flex flex-col gap-0.5">
              <span className="text-xs font-bold text-ba-ink-soft truncate">{modeLabel}</span>
              <h1 className="font-display text-xl font-black leading-tight text-ba-navy truncate">
                {heading}
              </h1>
            </div>
            {/* 回答後もタイトル行の高さが変わらないよう、リングは消さず invisible で隠す */}
            <HaloRingGauge
              value={remainingStages / totalStages}
              size={52}
              label={answered ? undefined : `残りヒント ${remainingStages}`}
              className={answered ? "invisible" : ""}
            >
              <span className="font-display text-base font-black text-ba-blue">
                {remainingStages}
              </span>
            </HaloRingGauge>
          </div>

          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0">
            {isDesktop ? (
              <HintList hints={hints} revealedCount={revealedHintCount} />
            ) : (
              <HintList
                hints={hints}
                revealedCount={revealedHintCount}
                student={student}
                portraitState={portraitState}
                layout="mobile"
              />
            )}
          </div>

          {!isDesktop && answered && (
            <div className="py-3 flex flex-col items-center gap-3">
              <StudentReveal student={student} correct={correct} score={score} />
              {renderAfterAnswerActions?.(false)}
            </div>
          )}

          {/* 回答後は playArea が空になるため、枠（背景・ボーダー）ごと消す。
              -mx-4 -mb-4 は main の余白を打ち消して画面端まで白い面にするため */}
          {!isDesktop && !answered && (
            <div className="-mx-4 -mb-4 shrink-0 border-t border-ba-border bg-white px-4 py-3">
              {playArea}
            </div>
          )}
        </div>

        {isDesktop && (
          <aside className="flex w-[380px] xl:w-[420px] shrink-0 flex-col gap-3 min-h-0">
            <StudentPortrait student={student} state={portraitState} correct={correct} />
            {answered ? (
              <div
                className={`flex shrink-0 flex-col justify-center rounded-2xl border border-ba-border bg-white p-3.5 ${answerPanelMinHeightClass}`}
              >
                <StudentReveal student={student} correct={correct} score={score} showName={false} />
                {renderAfterAnswerActions?.(true)}
              </div>
            ) : (
              playArea
            )}
          </aside>
        )}
      </main>
    </div>
  );
}

export default QuizScreen;
