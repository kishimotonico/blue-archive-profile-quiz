import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz';
import { useDailyQuiz } from '../hooks/useDailyQuiz';
import {
  getDailySeed,
  getRandomStudent,
  createQuizQuestion,
  getDailyDate,
} from '../quiz-core';
import Header from '../components/layout/Header';
import HintList from '../components/quiz/HintList';
import AnswerInput from '../components/quiz/AnswerInput';
import ScoreDisplay from '../components/quiz/ScoreDisplay';
import StudentReveal from '../components/quiz/StudentReveal';
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
    revealNextHint,
    submitAnswer,
  } = useQuiz();

  const { isTodayCompleted, getTodayResult, saveTodayResult } = useDailyQuiz();
  const [loading, setLoading] = useState(true);
  const [showResultModal, setShowResultModal] = useState(false);

  useEffect(() => {
    const initQuiz = async () => {
      // 今日の問題が既に完了しているかチェック
      const todayResult = getTodayResult();
      if (todayResult) {
        setLoading(false);
        return;
      }

      // 日替わりシードで問題を生成
      const seed = getDailySeed();
      const student = await getRandomStudent(seed);
      const question = createQuizQuestion(student, seed);

      setCurrentQuestion(question);
      setLoading(false);
    };

    initQuiz();
  }, [setCurrentQuestion, getTodayResult]);

  useEffect(() => {
    // 回答が完了したら結果を保存
    if (answered && currentQuestion) {
      saveTodayResult({
        score,
        revealedHintCount,
        studentId: currentQuestion.student.id,
      });
      setShowResultModal(true);
    }
  }, [answered, currentQuestion, score, revealedHintCount, saveTodayResult]);

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
                <p className="mt-4">明日また挑戦してください！</p>
              </div>

              <Link to="/" className="block mt-8">
                <Button variant="primary">ホームに戻る</Button>
              </Link>
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

          {/* ヒント一覧 */}
          <HintList hints={currentQuestion.hints} revealedCount={revealedHintCount} />

          {/* 回答フォーム */}
          {!answered && (
            <div className="space-y-4">
              <AnswerInput onSubmit={submitAnswer} />

              <div className="flex justify-center">
                <Button
                  onClick={revealNextHint}
                  variant="secondary"
                  disabled={revealedHintCount >= currentQuestion.hints.length}
                >
                  次のヒントを開示
                </Button>
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
          <p className="text-sm text-gray-500">
            使用ヒント数: {revealedHintCount}
          </p>

          <div className="mt-6 space-y-2">
            <Link to="/" className="block">
              <Button variant="primary" className="w-full">
                ホームに戻る
              </Button>
            </Link>
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
