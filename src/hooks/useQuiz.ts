import { useAtom } from 'jotai';
import { useCallback } from 'react';
import {
  currentQuestionAtom,
  revealedHintCountAtom,
  answeredAtom,
  correctAtom,
  scoreAtom,
} from '../store/quiz';
import { checkAnswer, calculateScore } from '../quiz-core';

export function useQuiz() {
  const [currentQuestion, setCurrentQuestion] = useAtom(currentQuestionAtom);
  const [revealedHintCount, setRevealedHintCount] = useAtom(revealedHintCountAtom);
  const [answered, setAnswered] = useAtom(answeredAtom);
  const [correct, setCorrect] = useAtom(correctAtom);
  const [score, setScore] = useAtom(scoreAtom);

  /**
   * 次のヒントを開示
   */
  const revealNextHint = useCallback(() => {
    if (!currentQuestion) return;
    if (answered) return;
    if (revealedHintCount >= currentQuestion.hints.length) return;

    setRevealedHintCount((prev) => prev + 1);
  }, [currentQuestion, answered, revealedHintCount, setRevealedHintCount]);

  /**
   * 回答を提出
   */
  const submitAnswer = useCallback(
    (answer: string) => {
      if (!currentQuestion) return;
      if (answered) return;

      const isCorrect = checkAnswer(answer, currentQuestion.student);
      const calculatedScore = calculateScore(revealedHintCount, isCorrect);

      setCorrect(isCorrect);
      setScore(calculatedScore);
      setAnswered(true);
    },
    [currentQuestion, answered, revealedHintCount, setCorrect, setScore, setAnswered]
  );

  /**
   * クイズをリセット
   */
  const resetQuiz = useCallback(() => {
    setCurrentQuestion(null);
    setRevealedHintCount(0);
    setAnswered(false);
    setCorrect(false);
    setScore(0);
  }, [setCurrentQuestion, setRevealedHintCount, setAnswered, setCorrect, setScore]);

  return {
    currentQuestion,
    setCurrentQuestion,
    revealedHintCount,
    answered,
    correct,
    score,
    revealNextHint,
    submitAnswer,
    resetQuiz,
  };
}
