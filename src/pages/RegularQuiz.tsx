import { useEffect, useRef, useCallback } from "react";
import { useRegularQuiz } from "../hooks/useRegularQuiz";
import { useIsDesktop } from "../hooks/useIsDesktop";
import Header from "../components/layout/Header";
import HintList from "../components/quiz/HintList";
import StudentReveal from "../components/quiz/StudentReveal";
import StudentPortrait from "../components/quiz/StudentPortrait";
import Button from "../components/common/Button";
import HaloRingGauge from "../components/common/HaloRingGauge";
import QuizLoadingState from "../components/quiz/QuizLoadingState";
import QuizErrorState from "../components/quiz/QuizErrorState";
import QuizPlayArea from "../components/quiz/QuizPlayArea";
import { getPortraitState } from "../components/quiz/portraitUtils";

function RegularQuiz() {
  const {
    currentQuestion,
    revealedHintCount,
    answered,
    correct,
    score,
    answerFeedback,
    errorKey,
    revealNextHint,
    submitAnswer,
    giveUp,
    loading,
    currentQuestionIndex,
    totalScore,
    goNext,
    TOTAL_QUESTIONS,
  } = useRegularQuiz();

  const isDesktop = useIsDesktop();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hintButtonRef = useRef<HTMLButtonElement>(null);

  // 問題切替時にヒントボタンにフォーカス
  useEffect(() => {
    if (!loading && !answered && hintButtonRef.current) {
      hintButtonRef.current.focus();
    }
  }, [loading, answered, currentQuestionIndex]);

  const handleNext = useCallback(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "instant" });
    goNext();
  }, [goNext]);

  // 回答後、Enterキーで次の問題へ
  useEffect(() => {
    if (!answered) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        handleNext();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [answered, handleNext]);

  // 回答確定時、モバイルではヒントグリッド内の立ち絵が見える位置までスクロールする
  useEffect(() => {
    if (!answered || isDesktop) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    // QuizPlayArea のアンマウントと結果表示のマウントでレイアウト高さが変わるため、
    // 再レイアウトが終わった次フレームでスクロール位置を決める
    let innerFrame = 0;
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => {
        const portrait = container.querySelector<HTMLElement>("[data-portrait]");
        // offsetParent が null のときは非表示（md以上のレイアウト）なのでスクロールしない
        if (!portrait || !portrait.offsetParent) return;
        const top =
          portrait.getBoundingClientRect().top -
          container.getBoundingClientRect().top +
          container.scrollTop;
        container.scrollTo({ top, behavior: "smooth" });
      });
    });
    return () => {
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(innerFrame);
    };
  }, [answered, isDesktop]);

  if (loading) return <QuizLoadingState />;
  if (!currentQuestion) return <QuizErrorState />;

  const portraitState = getPortraitState(answered, revealedHintCount, currentQuestion.hints.length);
  const totalStages = currentQuestion.hints.length + 1; // 全ヒント + シルエット
  const remainingStages = Math.max(totalStages - revealedHintCount, 0);

  return (
    <div className="h-[100dvh] flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 pt-2 md:pt-4 max-w-6xl xl:max-w-7xl mx-auto w-full overflow-hidden">
        {/* 左ペイン: タイトル + ヒント一覧 */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* タイトル + 残りヒント数 */}
          {/* pr-16: モバイル右上固定のハンバーガーボタン（top-3 right-3, w-11 h-11）とゲージが
              重ならないよう避けるための余白。md以上ではハンバーガーが無いので不要 */}
          <div className="shrink-0 flex items-center justify-between gap-3 py-3 pr-16 md:py-1.5 md:pr-0">
            <div className="inline-flex min-w-0 items-center gap-2 rounded-2xl bg-linear-to-br from-ba-cyan to-ba-blue px-4 py-2 text-white shadow-sm md:px-3 md:py-1.5">
              <div className="ba-tag shrink-0 bg-white/25">
                <span>FREE PLAY</span>
              </div>
              <h1 className="font-display text-sm font-black leading-tight truncate sm:text-base">
                {currentQuestionIndex + 1} / {TOTAL_QUESTIONS} 問目・合計 {totalScore}点
              </h1>
            </div>
            {!answered && (
              <HaloRingGauge
                value={remainingStages / totalStages}
                size={52}
                label="残りヒント数の表示"
                className="shrink-0"
              >
                <span className="font-display text-base font-black text-ba-blue">
                  {remainingStages}
                </span>
                <span className="hidden text-[10px] text-ba-ink-soft md:block">HINT残</span>
              </HaloRingGauge>
            )}
          </div>

          {/* スクロール可能なヒントエリア（デスクトップは2列・上寄せ） */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0">
            {isDesktop ? (
              <HintList hints={currentQuestion.hints} revealedCount={revealedHintCount} />
            ) : (
              <HintList
                hints={currentQuestion.hints}
                revealedCount={revealedHintCount}
                student={currentQuestion.student}
                portraitState={portraitState}
                showPortraitInGrid={true}
                compactMode={true}
              />
            )}
          </div>

          {/* モバイル: 回答結果表示（デスクトップは右カラムに出す） */}
          {!isDesktop && answered && (
            <div className="py-3 flex flex-col items-center gap-3">
              <StudentReveal student={currentQuestion.student} correct={correct} score={score} />
              <Button onClick={handleNext} variant="primary">
                {currentQuestionIndex + 1 < TOTAL_QUESTIONS ? "次の問題へ" : "結果を見る"}
              </Button>
            </div>
          )}

          {/* モバイル: 固定フッターの入力欄・ボタン類 */}
          {!isDesktop && !answered && (
            <div className="shrink-0 pt-3 border-t border-ba-border bg-ba-bg">
              <QuizPlayArea
                hintButtonRef={hintButtonRef}
                revealedHintCount={revealedHintCount}
                hintsLength={currentQuestion.hints.length}
                revealNextHint={revealNextHint}
                submitAnswer={submitAnswer}
                giveUp={giveUp}
                answerFeedback={answerFeedback}
                errorKey={errorKey}
                answered={answered}
              />
            </div>
          )}
        </div>

        {/* 右カラム（デスクトップのみ）: 立ち絵 → 操作/結果 */}
        {isDesktop && (
          <aside className="flex w-[380px] xl:w-[420px] shrink-0 flex-col gap-3 min-h-0">
            <StudentPortrait
              student={currentQuestion.student}
              state={portraitState}
              correct={correct}
            />
            {answered ? (
              <div className="shrink-0 rounded-2xl border border-ba-border bg-white p-3.5 shadow-xs">
                <StudentReveal student={currentQuestion.student} correct={correct} score={score} />
                <Button onClick={handleNext} variant="primary" className="mt-2 w-full">
                  {currentQuestionIndex + 1 < TOTAL_QUESTIONS ? "次の問題へ" : "結果を見る"}
                </Button>
              </div>
            ) : (
              <QuizPlayArea
                hintButtonRef={hintButtonRef}
                revealedHintCount={revealedHintCount}
                hintsLength={currentQuestion.hints.length}
                revealNextHint={revealNextHint}
                submitAnswer={submitAnswer}
                giveUp={giveUp}
                answerFeedback={answerFeedback}
                errorKey={errorKey}
                answered={answered}
              />
            )}
          </aside>
        )}
      </main>
    </div>
  );
}

export default RegularQuiz;
