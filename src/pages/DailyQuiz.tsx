import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { useQuiz } from '../hooks/useQuiz';
import { useDailyQuiz } from '../hooks/useDailyQuiz';
import {
  getDailySeed,
  getRandomStudent,
  createQuizQuestion,
  getDailyDate,
  getTimeUntilNextReset,
  loadStudents,
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
import ScoreDisplay from '../components/quiz/ScoreDisplay';
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
  } = useQuiz();

  const { isTodayCompleted, getTodayResult, saveTodayResult, saveProgress, loadProgress, clearProgress } = useDailyQuiz();
  const [, setAllStudents] = useAtom(allStudentsAtom);
  const [totalAttempts] = useAtom(totalAttemptsAtom);
  const [scoreDistribution] = useAtom(scoreDistributionAtom);
  const [bestScore] = useAtom(bestScoreAtom);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);

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
      setShowResultModal(true);
    }
  }, [answered, currentQuestion, score, revealedHintCount, saveTodayResult, clearProgress]);

  const handleGiveUp = () => {
    if (!currentQuestion) return;
    // ギブアップ = 不正解として扱う（スコア0）
    submitAnswer(''); // 空文字で不正解
    setShowGiveUpModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-gray-600">読み込み中...</div>
        </div>
      </div>
    );
  }

  const todayResult = getTodayResult();
  const today = getDailyDate();

  if (isTodayCompleted && todayResult) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-center mb-8">
            日替わりクイズ ({today})
          </h1>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                今日のクイズは完了済みです
              </h2>

              <ScoreDisplay score={todayResult.score} />

              <div className="mt-6 text-gray-600">
                <p>使用ヒント数: {todayResult.revealedHintCount}</p>
                <p className="mt-4">次の問題まで: {getTimeUntilNextReset()}</p>
              </div>

              <div className="mt-8 space-y-2">
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
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-gray-600">問題の読み込みに失敗しました</div>
        </div>
      </div>
    );
  }

  // 立ち絵の表示状態を計算
  const getPortraitState = () => {
    if (answered) return 'revealed';
    if (revealedHintCount >= currentQuestion.hints.length) return 'silhouette';
    return 'hidden';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          日替わりクイズ ({today})
        </h1>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* スコア表示 */}
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold text-gray-700">
              開示ヒント数: {revealedHintCount} / {currentQuestion.hints.length}
            </div>
            <ScoreDisplay score={score} showMax={false} />
          </div>

          {/* 立ち絵表示 */}
          <div className="flex justify-center">
            <StudentPortrait
              student={currentQuestion.student}
              state={getPortraitState()}
            />
          </div>

          {/* ヒント一覧 */}
          <HintList hints={currentQuestion.hints} revealedCount={revealedHintCount} />

          {/* 回答フォーム */}
          {!answered && (
            <div className="space-y-4">
              <AnswerInput onSubmit={submitAnswer} />

              {/* 誤答フィードバック */}
              {answerFeedback && (
                <div className="text-center text-red-600 font-semibold">
                  {answerFeedback}
                </div>
              )}

              <div className="flex justify-center">
                {revealedHintCount < currentQuestion.hints.length ? (
                  <Button
                    onClick={revealNextHint}
                    variant="secondary"
                  >
                    次のヒントを開示
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowGiveUpModal(true)}
                    variant="danger"
                  >
                    諦めて正解を表示
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* 正解表示 */}
          {answered && (
            <StudentReveal student={currentQuestion.student} correct={correct} />
          )}
        </div>
      </div>

      {/* 結果モーダル */}
      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title="クイズ完了"
      >
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600 mb-4">
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
              <p className="text-sm text-gray-600 mb-2">スコア分布:</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>9点 (完璧):</span>
                  <span>{scoreDistribution.perfect}回</span>
                </div>
                <div className="flex justify-between">
                  <span>7-8点:</span>
                  <span>{scoreDistribution.veryHigh}回</span>
                </div>
                <div className="flex justify-between">
                  <span>5-6点:</span>
                  <span>{scoreDistribution.high}回</span>
                </div>
                <div className="flex justify-between">
                  <span>3-4点:</span>
                  <span>{scoreDistribution.medium}回</span>
                </div>
                <div className="flex justify-between">
                  <span>1-2点:</span>
                  <span>{scoreDistribution.low}回</span>
                </div>
                <div className="flex justify-between">
                  <span>0点:</span>
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

      {/* ギブアップ確認モーダル */}
      <Modal
        isOpen={showGiveUpModal}
        onClose={() => setShowGiveUpModal(false)}
        title="ギブアップ確認"
      >
        <div className="text-center">
          <p className="text-gray-700 mb-6">
            本当にギブアップしますか？<br />
            スコアは0点になります。
          </p>

          <div className="space-y-2">
            <Button
              variant="danger"
              className="w-full"
              onClick={handleGiveUp}
            >
              ギブアップする
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setShowGiveUpModal(false)}
            >
              キャンセル
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default DailyQuiz;
