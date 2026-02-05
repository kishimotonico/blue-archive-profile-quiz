import { useEffect, useState, useRef } from 'react';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hintButtonRef = useRef<HTMLButtonElement>(null);

  // 初期化
  useEffect(() => {
    const initQuiz = async () => {
      // 前のモードからの状態をリセット
      resetQuiz();

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

  // 問題切替時にヒントボタンにフォーカス
  useEffect(() => {
    if (!loading && !answered && hintButtonRef.current) {
      hintButtonRef.current.focus();
    }
  }, [loading, answered, currentQuestionIndex]);

  // 正解表示時、Enterキーで次の問題へ
  useEffect(() => {
    if (!answered) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered]);

  const handleNext = () => {
    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < students.length) {
      // スクロール位置をリセット
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'instant' });

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
            <div className="py-3 flex flex-col items-center gap-3">
              <StudentReveal student={currentQuestion.student} correct={correct} score={score} />
              <Button onClick={handleNext} variant="primary">
                {currentQuestionIndex + 1 < TOTAL_QUESTIONS
                  ? '次の問題へ'
                  : '結果を見る'}
              </Button>
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
    </div>
  );
}

export default RegularQuiz;
