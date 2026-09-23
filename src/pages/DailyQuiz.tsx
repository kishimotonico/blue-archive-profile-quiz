import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom, useSetAtom, useStore } from "jotai";
import { useQuiz } from "../hooks/useQuiz";
import { useDailyQuiz } from "../hooks/useDailyQuiz";
import {
  createDailyQuestion,
  createQuestion,
  getTimeUntilNextReset,
  getScoreRank,
  getDailyDate,
} from "../quiz-core";
import { answeredAtom, correctAtom, scoreAtom } from "../store/quiz";
import {
  totalAttemptsAtom,
  scoreDistributionAtom,
  bestScoreAtom,
  dailyProgressAtom,
  dailyResultsStorageAtom,
} from "../store/daily";
import Header from "../components/layout/Header";
import { preloadPortraitImage } from "../components/quiz/portraitImageUrl";
import HintList from "../components/quiz/HintList";
import StudentReveal from "../components/quiz/StudentReveal";
import StudentPortrait from "../components/quiz/StudentPortrait";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import HaloRingGauge from "../components/common/HaloRingGauge";
import QuizLoadingState from "../components/quiz/QuizLoadingState";
import QuizErrorState from "../components/quiz/QuizErrorState";
import QuizPlayArea from "../components/quiz/QuizPlayArea";
import { getPortraitState } from "../components/quiz/portraitUtils";

function formatTimeUntilNextReset({ hours, minutes }: { hours: number; minutes: number }): string {
  return hours > 0 ? `${hours}時間${minutes}分後` : `${minutes}分後`;
}

function DailyQuiz() {
  const {
    currentQuestion,
    setCurrentQuestion,
    revealedHintCount,
    setRevealedHintCount,
    answered,
    correct,
    score,
    answerFeedback,
    errorKey,
    revealNextHint,
    submitAnswer,
    giveUp,
  } = useQuiz();

  const { saveTodayResult, discardTodayResult, saveProgress, clearProgress } = useDailyQuiz();
  const setAnswered = useSetAtom(answeredAtom);
  const setCorrect = useSetAtom(correctAtom);
  const setScore = useSetAtom(scoreAtom);
  const [totalAttempts] = useAtom(totalAttemptsAtom);
  const [scoreDistribution] = useAtom(scoreDistributionAtom);
  const [bestScore] = useAtom(bestScoreAtom);
  const store = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);
  const hintButtonRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const initQuiz = async () => {
      // 永続化値を同期的に取得する。store.get は購読を介さないため、useAtom の
      // onMount より前のタイミングでも安全に値が読める（getOnInit: true 必須）。
      const today = getDailyDate();
      const storedResults = store.get(dailyResultsStorageAtom);
      const todayResult = storedResults.recent.find((r) => r.key.baseDate === today);

      if (todayResult) {
        const restored = await createQuestion(todayResult.key);
        if (cancelled) return;

        // 整合性チェック: key から復元した生徒と保存した studentId が一致するか確認
        if (restored.student.id !== todayResult.studentId) {
          console.warn(
            `Quiz integrity mismatch: expected ${todayResult.studentId}, got ${restored.student.id}. Discarding stored result.`,
          );
          discardTodayResult();
          clearProgress();
          const question = await createDailyQuestion();
          if (cancelled) return;
          preloadPortraitImage(question.student);
          setCurrentQuestion(question);
          setLoading(false);
          return;
        }

        preloadPortraitImage(restored.student);
        setCurrentQuestion(restored);
        setRevealedHintCount(restored.hints.length + 1); // 全ヒント + 立ち絵を表示
        setAnswered(true);
        setCorrect(todayResult.correct);
        setScore(todayResult.score);
        setIsAlreadyCompleted(true);
        setLoading(false);
        return;
      }

      // 進行中の復元を試みる
      const storedProgress = store.get(dailyProgressAtom);
      if (storedProgress && storedProgress.key.baseDate === today) {
        const restored = await createQuestion(storedProgress.key);
        if (cancelled) return;
        preloadPortraitImage(restored.student);
        setCurrentQuestion(restored);
        setRevealedHintCount(storedProgress.revealedHintCount);
        setLoading(false);
        return;
      }

      // 新規プレイ
      const question = await createDailyQuestion();
      if (cancelled) return;
      preloadPortraitImage(question.student);
      setCurrentQuestion(question);
      setLoading(false);
    };

    initQuiz();
    return () => {
      cancelled = true;
    };
    // 初期化はマウント時に 1 回だけ実行する。永続化値は store.get で同期取得しているため
    // 依存配列に atom を入れる必要は無く、入れると onMount の hydration で再実行されて
    // 競合するので意図的に空配列にしている。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // 進行状態を保存（ヒント開示時）
    if (loading || answered) return;
    if (currentQuestion && revealedHintCount > 0) {
      saveProgress({
        key: currentQuestion.key,
        revealedHintCount,
      });
    }
  }, [loading, currentQuestion, answered, revealedHintCount, saveProgress]);

  useEffect(() => {
    // 回答が完了したら結果を保存（既に完了済みの場合は除く）
    if (answered && currentQuestion && !isAlreadyCompleted) {
      saveTodayResult({
        key: currentQuestion.key,
        studentId: currentQuestion.student.id,
        score,
        revealedHintCount,
        correct,
      });
      clearProgress(); // 進行状態をクリア

      // 立ち絵のフェードイン演出を見せるため、1.5秒遅延してモーダルを表示
      const timer = setTimeout(() => {
        setShowResultModal(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [
    answered,
    currentQuestion,
    score,
    revealedHintCount,
    correct,
    isAlreadyCompleted,
    saveTodayResult,
    clearProgress,
  ]);

  // クイズ開始時にヒントボタンにフォーカス
  useEffect(() => {
    if (!loading && !answered && hintButtonRef.current) {
      hintButtonRef.current.focus();
    }
  }, [loading, answered]);

  // 回答確定時、モバイルではヒントグリッド内の立ち絵が見える位置までスクロールする
  useEffect(() => {
    if (!answered) return;
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
  }, [answered]);

  if (loading) return <QuizLoadingState />;
  if (!currentQuestion) return <QuizErrorState />;

  const portraitState = getPortraitState(answered, revealedHintCount, currentQuestion.hints.length);
  const totalStages = currentQuestion.hints.length + 1; // 全ヒント + シルエット
  const remainingStages = Math.max(totalStages - revealedHintCount, 0);

  return (
    <div className="h-[100dvh] flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col md:flex-row gap-4 p-4 pt-2 md:pt-4 max-w-6xl mx-auto w-full overflow-hidden">
        {/* 左ペイン: ヒント + 入力エリア */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 md:justify-center">
          {/* タイトル + 残りヒント数 */}
          {/* pr-16: モバイル右上固定のハンバーガーボタン（top-3 right-3, w-11 h-11）とゲージが
              重ならないよう避けるための余白。md以上ではハンバーガーが無いので不要 */}
          <div className="shrink-0 flex items-center justify-between gap-3 py-3 pr-16 md:py-1.5 md:pr-0">
            <div className="inline-flex min-w-0 items-center gap-2 rounded-2xl bg-linear-to-br from-ba-cyan to-ba-blue px-4 py-2 text-white shadow-sm md:px-3 md:py-1.5">
              <div className="ba-tag shrink-0 bg-white/25">
                <span>DAILY QUIZ</span>
              </div>
              <h1 className="font-display text-sm font-black leading-tight truncate sm:text-base">
                {(() => {
                  const [, month, day] = getDailyDate().split("-");
                  return `${Number(month)}月${Number(day)}日のクイズ`;
                })()}
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

          {/* スクロール可能なヒントエリア */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto min-h-0 md:flex-[0_1_auto]"
          >
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

            {/* PC: ヒントのみ（md:2列 / lg以上:3列グリッド） */}
            <div className="hidden md:block">
              <HintList hints={currentQuestion.hints} revealedCount={revealedHintCount} />
            </div>
          </div>

          {/* 回答結果表示 */}
          {answered && (
            <div className="py-3 flex justify-center">
              <StudentReveal student={currentQuestion.student} correct={correct} score={score} />
            </div>
          )}

          {/* 固定フッター: 入力欄・ボタン類（回答後は中身が無いので枠ごと消す） */}
          {(!answered || isAlreadyCompleted) && (
            <div className="shrink-0 pt-3 border-t border-ba-border bg-ba-bg">
              {isAlreadyCompleted && (
                <div className="bg-ba-sky-1 border border-ba-border rounded-2xl p-4 mb-3 text-center">
                  <p className="font-display font-black text-ba-navy mb-2">
                    今日のクイズは完了済みです
                  </p>
                  <p className="text-ba-ink-soft text-sm mb-2">
                    次の問題まで: {formatTimeUntilNextReset(getTimeUntilNextReset())}
                  </p>
                  <Button variant="primary" size="sm" onClick={() => navigate("/regular")}>
                    もっと遊ぶ
                  </Button>
                </div>
              )}
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

        {/* 右ペイン: キャラ画像（PC のみ） */}
        <div className="hidden md:flex w-40 lg:w-48 xl:w-56 2xl:w-64 shrink-0 self-stretch items-center">
          <StudentPortrait
            student={currentQuestion.student}
            state={portraitState}
            variant="sidebar"
          />
        </div>
      </main>

      {/* 結果モーダル */}
      <Modal isOpen={showResultModal} onClose={() => setShowResultModal(false)}>
        <div className="text-center">
          <HaloRingGauge
            value={score / 10}
            size={124}
            strokeWidth={8}
            trackColor="var(--color-ba-border)"
            fillFrom="var(--color-ba-yellow)"
            fillTo="var(--color-ba-blue)"
            className="mx-auto mb-2"
          >
            <span className="font-display text-4xl font-black text-ba-blue">
              {getScoreRank(score)}
            </span>
            <span className="text-[10px] tracking-widest text-ba-ink-soft">RANK</span>
          </HaloRingGauge>

          <h2 className="text-sm font-bold text-ba-ink-soft mb-1">
            {correct ? "正解！" : "正解は…"}
          </h2>
          <p className="font-display text-xl font-black text-ba-navy mb-4">
            {currentQuestion.student.fullName}
          </p>

          <div className="flex items-baseline justify-center gap-1 rounded-lg border border-ba-yellow-soft bg-linear-to-b from-yellow-50 to-yellow-100 py-2 mb-4">
            <span className="font-display text-2xl font-black text-ba-navy">{score}</span>
            <span className="text-sm font-bold text-ba-ink-soft">/ 10 点</span>
          </div>

          <p className="text-sm text-ba-ink-soft mb-2">使用ヒント数: {revealedHintCount}</p>
          <p className="text-sm text-ba-ink-soft mb-6">
            次の問題まで: {formatTimeUntilNextReset(getTimeUntilNextReset())}
          </p>

          {/* 統計情報 */}
          <div className="bg-white border border-ba-border rounded-2xl p-4 mb-6 text-left">
            <h3 className="font-display text-base font-black text-ba-navy mb-3">統計情報</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ba-ink-soft">累積挑戦回数:</span>
                <span className="font-semibold text-ba-navy">{totalAttempts}回</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ba-ink-soft">ベストスコア:</span>
                <span className="font-semibold text-ba-navy">{bestScore}点</span>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-ba-ink-soft mb-2">ランク分布:</p>
              <div className="space-y-1 text-xs text-ba-navy">
                <div className="flex justify-between">
                  <span>SS (10点):</span>
                  <span>{scoreDistribution.perfect}回</span>
                </div>
                <div className="flex justify-between">
                  <span>S (8-9点):</span>
                  <span>{scoreDistribution.veryHigh}回</span>
                </div>
                <div className="flex justify-between">
                  <span>A (6-7点):</span>
                  <span>{scoreDistribution.high}回</span>
                </div>
                <div className="flex justify-between">
                  <span>B (4-5点):</span>
                  <span>{scoreDistribution.medium}回</span>
                </div>
                <div className="flex justify-between">
                  <span>C (1-3点):</span>
                  <span>{scoreDistribution.low}回</span>
                </div>
                <div className="flex justify-between">
                  <span>D (0点):</span>
                  <span>{scoreDistribution.zero}回</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button variant="primary" className="w-full" onClick={() => navigate("/regular")}>
              もっと遊ぶ
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setShowResultModal(false)}
            >
              結果を見る
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default DailyQuiz;
