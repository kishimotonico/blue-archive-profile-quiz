import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom, useSetAtom } from "jotai";
import { useQuiz } from "../hooks/useQuiz";
import { useDailyQuiz } from "../hooks/useDailyQuiz";
import {
  createDailyQuestion,
  getTimeUntilNextReset,
  loadStudents,
  getScoreRank,
  getDailyDate,
} from "../quiz-core";
import { allStudentsAtom, answeredAtom, correctAtom, scoreAtom } from "../store/quiz";
import { totalAttemptsAtom, scoreDistributionAtom, bestScoreAtom } from "../store/daily";
import Header from "../components/layout/Header";
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

  const { getTodayResult, saveTodayResult, saveProgress, dailyProgress, clearProgress } =
    useDailyQuiz();
  const setAllStudents = useSetAtom(allStudentsAtom);
  const setAnswered = useSetAtom(answeredAtom);
  const setCorrect = useSetAtom(correctAtom);
  const setScore = useSetAtom(scoreAtom);
  const [totalAttempts] = useAtom(totalAttemptsAtom);
  const [scoreDistribution] = useAtom(scoreDistributionAtom);
  const [bestScore] = useAtom(bestScoreAtom);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);
  const hintButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // loading中のみ初期化を実行（初期化が完了したらloadingをfalseにするため、再実行されない）
    if (!loading) return;

    const initQuiz = async () => {
      // 全生徒リストを読み込み
      const students = await loadStudents();
      setAllStudents(students);

      // 今日の問題が既に完了しているかチェック
      const todayResult = getTodayResult();
      if (todayResult) {
        // 回答済みの場合も問題を再生成して表示
        const question = await createDailyQuestion(todayResult.date);
        setCurrentQuestion(question);
        setRevealedHintCount(question.hints.length + 1); // 全ヒント + 立ち絵を表示

        // 回答済み状態を復元
        setAnswered(true);
        setCorrect(todayResult.score > 0); // スコアが0より大きければ正解
        setScore(todayResult.score);
        setIsAlreadyCompleted(true);

        setLoading(false);
        return;
      }

      // 進行状態の復元を試みる
      const today = getDailyDate();
      if (dailyProgress && dailyProgress.date === today) {
        // 進行状態から復元
        const student = students.find((s) => s.id === dailyProgress.studentId);
        if (student) {
          const question = {
            student,
            hints: dailyProgress.hints,
          };
          setCurrentQuestion(question);
          setRevealedHintCount(dailyProgress.revealedHintCount);
          setLoading(false);
          return;
        }
      }

      // 日替わりシードで問題を生成
      const question = await createDailyQuestion();

      setCurrentQuestion(question);
      setLoading(false);
    };

    initQuiz();
  }, [
    loading,
    dailyProgress,
    getTodayResult,
    setAllStudents,
    setCurrentQuestion,
    setRevealedHintCount,
    setAnswered,
    setCorrect,
    setScore,
  ]);

  useEffect(() => {
    // 進行状態を保存（ヒント開示時）
    // 注意: loading中や回答済みの場合は保存しない
    if (loading || answered) return;
    if (currentQuestion && revealedHintCount > 0) {
      saveProgress({
        studentId: currentQuestion.student.id,
        revealedHintCount,
        hints: currentQuestion.hints,
      });
    }
  }, [loading, currentQuestion, answered, revealedHintCount, saveProgress]);

  useEffect(() => {
    // 回答が完了したら結果を保存（既に完了済みの場合は除く）
    if (answered && currentQuestion && !isAlreadyCompleted) {
      saveTodayResult({
        score,
        revealedHintCount,
        studentId: currentQuestion.student.id,
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
