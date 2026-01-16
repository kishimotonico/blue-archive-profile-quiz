import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { useQuiz } from '../hooks/useQuiz';
import { getRandomStudents, createQuizQuestion, loadStudents, type Student } from '../quiz-core';
import { allStudentsAtom } from '../store/quiz';
import Header from '../components/layout/Header';
import HintList from '../components/quiz/HintList';
import AnswerInput from '../components/quiz/AnswerInput';
import StudentReveal from '../components/quiz/StudentReveal';
import StudentPortrait from '../components/quiz/StudentPortrait';
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
    answerFeedback,
    revealNextHint,
    submitAnswer,
    giveUp,
    resetQuiz,
  } = useQuiz();

  const [, setAllStudents] = useAtom(allStudentsAtom);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [scores, setScores] = useState<number[]>([]);

  // 初期化
  useEffect(() => {
    const initQuiz = async () => {
      // 全生徒リストを読み込み
      const allStudents = await loadStudents();
      setAllStudents(allStudents);

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
  }, [setCurrentQuestion, resetQuiz, setAllStudents]);

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
      <div className="h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl text-gray-600">読み込み中...</div>
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

      <main className="flex-1 flex gap-6 p-6 max-w-6xl mx-auto w-full overflow-hidden">
        {/* 左ペイン: 立ち絵 + 入力 */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          {/* 進捗表示 */}
          <div className="text-center text-sm text-gray-600">
            問題 {currentQuestionIndex + 1} / {TOTAL_QUESTIONS} | 合計: {totalScore}点
          </div>

          <StudentPortrait
            student={currentQuestion.student}
            state={getPortraitState()}
          />

          {!answered ? (
            <>
              <div className="w-full max-w-md">
                <AnswerInput onSubmit={submitAnswer} />
              </div>

              {answerFeedback && (
                <p className="text-red-500 text-sm font-semibold">{answerFeedback}</p>
              )}

              <div className="flex justify-center">
                {revealedHintCount < currentQuestion.hints.length ? (
                  <Button onClick={revealNextHint} variant="secondary">
                    次のヒントを開示
                  </Button>
                ) : revealedHintCount === currentQuestion.hints.length ? (
                  <Button onClick={revealNextHint} variant="secondary">
                    シルエットを表示
                  </Button>
                ) : (
                  <Button onClick={giveUp} variant="danger">
                    諦めて正解を表示
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <StudentReveal student={currentQuestion.student} correct={correct} />

              <Button onClick={handleNext} variant="primary" size="lg">
                {currentQuestionIndex + 1 < TOTAL_QUESTIONS
                  ? '次の問題へ'
                  : '結果を見る'}
              </Button>
            </>
          )}

          <div className="text-center">
            <span className="text-2xl font-bold text-blue-600">{score}点</span>
            <span className="text-sm text-gray-500 ml-2">
              ヒント {revealedHintCount}/{currentQuestion.hints.length}
            </span>
          </div>
        </div>

        {/* 右ペイン: ヒント一覧 */}
        <div className="w-72 flex flex-col gap-2">
          <HintList hints={currentQuestion.hints} revealedCount={revealedHintCount} />
        </div>
      </main>
    </div>
  );
}

export default RegularQuiz;
