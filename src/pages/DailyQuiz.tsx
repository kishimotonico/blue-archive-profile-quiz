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
import { preloadPortraitImage } from "../components/quiz/portraitImageUrl";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import { useIsAnyDialogOpen } from "../components/common/dialogRegistry";
import HaloRingGauge from "../components/common/HaloRingGauge";
import QuizLoadingState from "../components/quiz/QuizLoadingState";
import QuizErrorState from "../components/quiz/QuizErrorState";
import QuizScreen from "../components/quiz/QuizScreen";

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
  // 立ち絵の「全身を見る」モーダルなど他のダイアログが開いている間は、結果モーダルの
  // 自動表示を保留する。保留中フラグを分けているのは、保留を取り消すだけで
  // （setShowResultModalを呼ばずに）自動表示をキャンセルできるようにするため
  const [autoShowResultPending, setAutoShowResultPending] = useState(false);
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);
  const hintButtonRef = useRef<HTMLButtonElement>(null);
  const showResultButtonRef = useRef<HTMLButtonElement>(null);
  const isAnyDialogOpen = useIsAnyDialogOpen();

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

      // 立ち絵のフェードイン演出を見せるため、1.5秒遅延してモーダルを表示。
      // その時点で他のモーダル（全身を見るなど）が開いていることがあるため、
      // 即座には開かず「保留」にし、開いていない状態になってから開く
      const timer = setTimeout(() => {
        setAutoShowResultPending(true);
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

  useEffect(() => {
    if (!autoShowResultPending || isAnyDialogOpen) return;
    setShowResultModal(true);
    setAutoShowResultPending(false);
  }, [autoShowResultPending, isAnyDialogOpen]);

  // クイズ開始時にヒントボタンにフォーカス
  useEffect(() => {
    if (!loading && !answered && hintButtonRef.current) {
      hintButtonRef.current.focus();
    }
  }, [loading, answered]);

  if (loading) return <QuizLoadingState />;
  if (!currentQuestion) return <QuizErrorState />;

  const completedNotice = isAlreadyCompleted && (
    <div className="bg-ba-sky-1 border border-ba-border rounded-2xl p-4 mb-3 text-center">
      <p className="font-display font-black text-ba-navy mb-2">今日のクイズは完了済みです</p>
      <p className="text-ba-ink-soft text-sm mb-2">
        次の問題まで: {formatTimeUntilNextReset(getTimeUntilNextReset())}
      </p>
      <Button variant="primary" size="sm" onClick={() => navigate("/regular")}>
        もっと遊ぶ
      </Button>
    </div>
  );

  const rankDistribution = [
    { label: "SS (10点)", count: scoreDistribution.perfect },
    { label: "S (8-9点)", count: scoreDistribution.veryHigh },
    { label: "A (6-7点)", count: scoreDistribution.high },
    { label: "B (4-5点)", count: scoreDistribution.medium },
    { label: "C (1-3点)", count: scoreDistribution.low },
    { label: "D (0点)", count: scoreDistribution.zero },
  ];

  const heading = (() => {
    const [, month, day] = getDailyDate().split("-");
    return `${Number(month)}月${Number(day)}日`;
  })();

  return (
    <>
      <QuizScreen
        modeLabel="日替わりクイズ"
        heading={heading}
        student={currentQuestion.student}
        hints={currentQuestion.hints}
        revealedHintCount={revealedHintCount}
        answered={answered}
        correct={correct}
        score={score}
        hintButtonRef={hintButtonRef}
        revealNextHint={revealNextHint}
        submitAnswer={submitAnswer}
        giveUp={giveUp}
        answerFeedback={answerFeedback}
        errorKey={errorKey}
        afterAnswerActions={
          <>
            {completedNotice}
            <Button
              ref={showResultButtonRef}
              variant="primary"
              className="w-full"
              onClick={() => {
                // 手動で先に開いた場合、保留中の自動表示が閉じた直後に再度開き直すのを防ぐ
                setAutoShowResultPending(false);
                setShowResultModal(true);
              }}
            >
              結果を見る
            </Button>
          </>
        }
      />

      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        ariaLabel="今日のクイズの結果"
        focusFallbackRef={showResultButtonRef}
      >
        <div className="text-center">
          <HaloRingGauge
            value={score / 10}
            size={100}
            strokeWidth={7}
            trackColor="var(--color-ba-border)"
            fillFrom="var(--color-ba-yellow)"
            fillTo="var(--color-ba-blue)"
            className="mx-auto mb-1"
          >
            <span className="font-display text-3xl font-black text-ba-blue">
              {getScoreRank(score)}
            </span>
            <span className="text-[10px] tracking-widest text-ba-ink-soft">RANK</span>
          </HaloRingGauge>

          <h2 className="text-sm font-bold text-ba-ink-soft mb-1">
            {correct ? "正解！" : "正解は…"}
          </h2>
          <p className="font-display text-xl font-black text-ba-navy mb-2">
            {currentQuestion.student.fullName}
          </p>

          <div className="flex items-baseline justify-center gap-1 rounded-lg border border-ba-yellow-soft bg-ba-yellow-soft/40 py-1.5 mb-3">
            <span className="font-display text-2xl font-black text-ba-navy">{score}</span>
            <span className="text-sm font-bold text-ba-ink-soft">/ 10 点</span>
          </div>

          <p className="text-sm text-ba-ink-soft mb-1">使用ヒント数: {revealedHintCount}</p>
          <p className="text-sm text-ba-ink-soft mb-4">
            次の問題まで: {formatTimeUntilNextReset(getTimeUntilNextReset())}
          </p>

          {/* 統計情報 */}
          <div className="border-t border-ba-border pt-3 mb-4 text-left">
            <h3 className="font-display text-base font-black text-ba-navy mb-2">統計情報</h3>

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-ba-ink-soft">累積挑戦回数:</span>
                <span className="font-semibold text-ba-navy">{totalAttempts}回</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ba-ink-soft">ベストスコア:</span>
                <span className="font-semibold text-ba-navy">{bestScore}点</span>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-sm text-ba-ink-soft mb-1.5">ランク分布:</p>
              <div className="grid grid-cols-3 gap-1.5 text-xs text-ba-navy">
                {rankDistribution.map(({ label, count }) => (
                  <div key={label} className="rounded-lg bg-ba-bg px-2 py-1.5 text-center">
                    <div className="font-bold">{label}</div>
                    <div>{count}回</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Button variant="primary" className="w-full" onClick={() => navigate("/regular")}>
              もっと遊ぶ
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setShowResultModal(false)}
            >
              閉じる
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default DailyQuiz;
