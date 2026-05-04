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
import QuizLoadingState from "../components/quiz/QuizLoadingState";
import QuizErrorState from "../components/quiz/QuizErrorState";
import QuizPlayArea from "../components/quiz/QuizPlayArea";
import { getPortraitState } from "../components/quiz/portraitUtils";

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

  if (loading) return <QuizLoadingState />;
  if (!currentQuestion) return <QuizErrorState />;

  const portraitState = getPortraitState(answered, revealedHintCount, currentQuestion.hints.length);

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 flex flex-col md:flex-row gap-4 p-4 pt-2 sm:pt-4 max-w-6xl mx-auto w-full overflow-hidden">
        {/* 左ペイン: ヒント + 入力エリア */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* 日付表示 */}
          <div className="shrink-0 text-center text-sm text-gray-600 py-3 sm:py-2">
            {(() => {
              const [, month, day] = getDailyDate().split("-");
              return `${Number(month)}月${Number(day)}日のクイズ`;
            })()}
          </div>

          {/* スクロール可能なヒントエリア */}
          <div className="flex-1 overflow-y-auto min-h-0">
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
            <div className="py-3 flex justify-center">
              <StudentReveal student={currentQuestion.student} correct={correct} score={score} />
            </div>
          )}

          {/* 固定フッター: 入力欄・ボタン類 */}
          <div className="shrink-0 pt-3 border-t border-gray-200 bg-slate-50">
            {isAlreadyCompleted && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3 text-center">
                <p className="text-blue-800 font-semibold mb-2">今日のクイズは完了済みです</p>
                <p className="text-blue-600 text-sm mb-2">
                  次の問題まで: {getTimeUntilNextReset()}
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
      <Modal isOpen={showResultModal} onClose={() => setShowResultModal(false)} title="クイズ完了">
        <div className="text-center">
          <div className="text-5xl font-bold text-blue-600 mb-2">{getScoreRank(score)}</div>
          <div className="text-2xl font-bold text-gray-700 mb-4">{score}点</div>
          <p className="text-gray-600 mb-4">{correct ? "正解です！" : "不正解でした..."}</p>
          <p className="text-sm text-gray-500 mb-2">使用ヒント数: {revealedHintCount}</p>
          <p className="text-sm text-gray-500 mb-6">次の問題まで: {getTimeUntilNextReset()}</p>

          {/* 統計情報 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">統計情報</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">累積挑戦回数:</span>
                <span className="font-semibold">{totalAttempts}回</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ベストスコア:</span>
                <span className="font-semibold">{bestScore}点</span>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">ランク分布:</p>
              <div className="space-y-1 text-xs">
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

          <div className="mt-6 space-y-2">
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
