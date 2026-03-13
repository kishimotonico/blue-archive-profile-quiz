import { useEffect, useRef, useCallback } from "react";
import { useRegularQuiz } from "../hooks/useRegularQuiz";
import Header from "../components/layout/Header";
import HintList from "../components/quiz/HintList";
import StudentReveal from "../components/quiz/StudentReveal";
import StudentPortrait from "../components/quiz/StudentPortrait";
import Button from "../components/common/Button";
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

  if (loading) return <QuizLoadingState />;
  if (!currentQuestion) return <QuizErrorState />;

  const portraitState = getPortraitState(answered, revealedHintCount, currentQuestion.hints.length);

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 flex flex-col md:flex-row gap-4 p-4 pt-2 sm:pt-4 max-w-6xl mx-auto w-full overflow-hidden">
        {/* 左ペイン: ヒント + 入力エリア */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* 進捗表示 */}
          <div className="shrink-0 text-center text-sm text-gray-600 py-3 sm:py-2">
            クイズ {currentQuestionIndex + 1} / {TOTAL_QUESTIONS} | 合計: {totalScore}点
          </div>

          {/* スクロール可能なヒントエリア */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0">
            {/* モバイル: ヒント+画像（グリッド内） */}
            <div className="md:hidden">
              <HintList
                hints={currentQuestion.hints}
                revealedCount={revealedHintCount}
                student={currentQuestion.student}
                portraitState={portraitState}
                showPortraitInGrid={true}
                compactMode={true}
              />
            </div>

            {/* PC: ヒントのみ（2列グリッド） */}
            <div className="hidden md:block">
              <HintList hints={currentQuestion.hints} revealedCount={revealedHintCount} />
            </div>
          </div>

          {/* 回答結果表示 */}
          {answered && (
            <div className="py-3 flex flex-col items-center gap-3">
              <StudentReveal student={currentQuestion.student} correct={correct} score={score} />
              <Button onClick={handleNext} variant="primary">
                {currentQuestionIndex + 1 < TOTAL_QUESTIONS ? "次の問題へ" : "結果を見る"}
              </Button>
            </div>
          )}

          {/* 固定フッター: 入力欄・ボタン類 */}
          <div className="shrink-0 pt-3 border-t border-gray-200 bg-slate-50">
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
        </div>

        {/* 右ペイン: キャラ画像（PC のみ） */}
        <div className="hidden md:flex w-40 lg:w-48 xl:w-56 2xl:w-64 shrink-0 self-stretch items-center">
          <StudentPortrait
            student={currentQuestion.student}
            state={portraitState}
            variant="sidebar"
          />
        </div>
      </main>
    </div>
  );
}

export default RegularQuiz;
