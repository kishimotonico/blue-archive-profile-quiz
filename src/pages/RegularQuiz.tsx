import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz';
import { getRandomStudents, createQuizQuestion, type Student } from '../quiz-core';
import Header from '../components/layout/Header';
import HintList from '../components/quiz/HintList';
import AnswerInput from '../components/quiz/AnswerInput';
import ScoreDisplay from '../components/quiz/ScoreDisplay';
import StudentReveal from '../components/quiz/StudentReveal';
import Button from '../components/common/Button';

const TOTAL_QUESTIONS = 10;

function RegularQuiz() {
  const {
    currentQuestion,
    setCurrentQuestion,
    revealedHintCount,
    answered,
    correct,
    score,
    revealNextHint,
    submitAnswer,
    resetQuiz,
  } = useQuiz();

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [scores, setScores] = useState<number[]>([]);

  // 初期化
  useEffect(() => {
    const initQuiz = async () => {
      const randomStudents = await getRandomStudents(TOTAL_QUESTIONS);
      setStudents(randomStudents);

      if (randomStudents.length > 0) {
        const question = createQuizQuestion(randomStudents[0]);
        setCurrentQuestion(question);
      }

      setLoading(false);
    };

    initQuiz();

    return () => {
      resetQuiz();
    };
  }, [setCurrentQuestion, resetQuiz]);

  // 回答完了時の処理
  useEffect(() => {
    if (answered) {
      setTotalScore((prev) => prev + score);
      setScores((prev) => [...prev, score]);
    }
  }, [answered, score]);

  const handleNext = () => {
    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < students.length) {
      // 次の問題へ
      const question = createQuizQuestion(students[nextIndex]);
      setCurrentQuestion(question);
      setCurrentQuestionIndex(nextIndex);
      resetQuiz();
      setCurrentQuestion(question);
    } else {
      // 全問題完了
      navigate('/result', {
        state: {
          totalScore,
          scores: [...scores, score],
          totalQuestions: TOTAL_QUESTIONS,
        },
      });
    }
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
        <h1 className="text-3xl font-bold text-center mb-8">レギュラーモード</h1>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* 進捗表示 */}
          <div className="flex justify-between items-center bg-white rounded-lg shadow p-4">
            <div className="text-lg font-semibold text-gray-700">
              問題 {currentQuestionIndex + 1} / {TOTAL_QUESTIONS}
            </div>
            <div className="text-lg font-semibold text-blue-600">
              合計スコア: {totalScore}
            </div>
          </div>

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
            <>
              <StudentReveal student={currentQuestion.student} correct={correct} />

              <div className="flex justify-center">
                <Button onClick={handleNext} variant="primary" size="lg">
                  {currentQuestionIndex + 1 < TOTAL_QUESTIONS
                    ? '次の問題へ'
                    : '結果を見る'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RegularQuiz;
