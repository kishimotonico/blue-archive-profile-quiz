import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { useQuiz } from '../hooks/useQuiz';
import { useDailyQuiz } from '../hooks/useDailyQuiz';
import {
  getDailySeed,
  getRandomStudent,
  createQuizQuestion,
  getTimeUntilNextReset,
  loadStudents,
  getScoreRank,
} from '../quiz-core';
import { allStudentsAtom } from '../store/quiz';
import {
  totalAttemptsAtom,
  scoreDistributionAtom,
  bestScoreAtom,
} from '../store/daily';
import Header from '../components/layout/Header';
import HintList from '../components/quiz/HintList';
import AnswerInput from '../components/quiz/AnswerInput';
import StudentReveal from '../components/quiz/StudentReveal';
import StudentPortrait from '../components/quiz/StudentPortrait';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

function DailyQuiz() {
  const {
    currentQuestion,
    setCurrentQuestion,
    revealedHintCount,
    answered,
    correct,
    score,
    answerFeedback,
    revealNextHint,
    submitAnswer,
    giveUp,
  } = useQuiz();

  const { isTodayCompleted, getTodayResult, saveTodayResult, saveProgress, loadProgress, clearProgress } = useDailyQuiz();
  const [, setAllStudents] = useAtom(allStudentsAtom);
  const [totalAttempts] = useAtom(totalAttemptsAtom);
  const [scoreDistribution] = useAtom(scoreDistributionAtom);
  const [bestScore] = useAtom(bestScoreAtom);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showResultModal, setShowResultModal] = useState(false);
  const hintButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const initQuiz = async () => {
      // 全生徒リストを読み込み
      const students = await loadStudents();
      setAllStudents(students);

      // 今日の問題が既に完了しているかチェック
      const todayResult = getTodayResult();
      if (todayResult) {
        setLoading(false);
        return;
      }

      // 進行状態の復元を試みる
      const progress = loadProgress();
      if (progress) {
        // 進行状態から復元
        const student = students.find(s => s.id === progress.studentId);
        if (student) {
          const question = {
            student,
            hints: progress.hints,
          };
          setCurrentQuestion(question);
          setLoading(false);
          return;
        }
      }

      // 日替わりシードで問題を生成
      const seed = getDailySeed();
      const student = await getRandomStudent(seed);
      const question = createQuizQuestion(student, seed);

      setCurrentQuestion(question);
      setLoading(false);
    };

    initQuiz();
  }, [setCurrentQuestion, getTodayResult, loadProgress, setAllStudents]);

  useEffect(() => {
    // 進行状態を保存（ヒント開示時）
    if (currentQuestion && !answered && revealedHintCount > 0) {
      saveProgress({
        studentId: currentQuestion.student.id,
        revealedHintCount,
        hints: currentQuestion.hints,
      });
    }
  }, [currentQuestion, answered, revealedHintCount, saveProgress]);

  useEffect(() => {
    // 回答が完了したら結果を保存
    if (answered && currentQuestion) {
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
  }, [answered, currentQuestion, score, revealedHintCount, saveTodayResult, clearProgress]);

  // クイズ開始時にヒントボタンにフォーカス
  useEffect(() => {
    if (!loading && !answered && hintButtonRef.current) {
      hintButtonRef.current.focus();
    }
  }, [loading, answered]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl text-gray-600">読み込み中...</div>
        </div>
      </div>
    );
  }

  const todayResult = getTodayResult();

  if (isTodayCompleted && todayResult) {
    return (
      <div className="h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              今日のクイズは完了済みです
            </h2>

            <div className="text-4xl font-bold text-blue-600 mb-4">{todayResult.score}点</div>

            <div className="text-gray-600 space-y-2">
              <p>使用ヒント数: {todayResult.revealedHintCount}</p>
              <p>次の問題まで: {getTimeUntilNextReset()}</p>
            </div>

            <div className="mt-8">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => navigate('/regular')}
              >
                もっと遊ぶ
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl text-gray-600">問題の読み込みに失敗しました</div>
        </div>
      </div>
    );
  }

  // 立ち絵の表示状態を計算
  const getPortraitState = () => {
    if (answered) return 'revealed';
    if (revealedHintCount > currentQuestion.hints.length) return 'silhouette';
    return 'hidden';
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 flex flex-col md:flex-row gap-4 p-4 max-w-6xl mx-auto w-full overflow-hidden">
        {/* 左ペイン: ヒント + 入力エリア */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* スクロール可能なヒントエリア */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* モバイル: ヒント+画像（グリッド内） */}
            <div className="md:hidden">
              <HintList
                hints={currentQuestion.hints}
                revealedCount={revealedHintCount}
                student={currentQuestion.student}
                portraitState={getPortraitState()}
                showPortraitInGrid={true}
              />
            </div>

            {/* PC: ヒントのみ（2列グリッド） */}
            <div className="hidden md:block">
              <HintList
                hints={currentQuestion.hints}
                revealedCount={revealedHintCount}
              />
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
            {!answered && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-full max-w-md">
                  <AnswerInput onSubmit={submitAnswer} />
                </div>

                {answerFeedback && (
                  <p className="text-red-500 text-sm font-semibold">{answerFeedback}</p>
                )}

                <div className="flex justify-center">
                  {revealedHintCount < currentQuestion.hints.length ? (
                    <Button ref={hintButtonRef} onClick={revealNextHint} variant="secondary" size="sm">
                      次のヒントを開示
                    </Button>
                  ) : revealedHintCount === currentQuestion.hints.length ? (
                    <Button ref={hintButtonRef} onClick={revealNextHint} variant="secondary" size="sm">
                      シルエットを表示
                    </Button>
                  ) : (
                    <Button ref={hintButtonRef} onClick={giveUp} variant="danger" size="sm">
                      諦めて正解を表示
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右ペイン: キャラ画像（PC のみ） */}
        <div className="hidden md:flex w-40 lg:w-48 xl:w-56 2xl:w-64 shrink-0 self-stretch items-center">
          <StudentPortrait
            student={currentQuestion.student}
            state={getPortraitState()}
            variant="sidebar"
          />
        </div>
      </main>

      {/* 結果モーダル */}
      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title="クイズ完了"
      >
        <div className="text-center">
          <div className="text-5xl font-bold text-blue-600 mb-2">
            {getScoreRank(score)}
          </div>
          <div className="text-2xl font-bold text-gray-700 mb-4">
            {score}点
          </div>
          <p className="text-gray-600 mb-4">
            {correct ? '正解です！' : '不正解でした...'}
          </p>
          <p className="text-sm text-gray-500 mb-2">
            使用ヒント数: {revealedHintCount}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            次の問題まで: {getTimeUntilNextReset()}
          </p>

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
            <Button
              variant="primary"
              className="w-full"
              onClick={() => navigate('/regular')}
            >
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
