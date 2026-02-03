import { useAtom } from 'jotai';
import { useCallback, useState } from 'react';
import {
  currentQuestionAtom,
  revealedHintCountAtom,
  answeredAtom,
  correctAtom,
  scoreAtom,
  allStudentsAtom,
} from '../store/quiz';
import { validateAnswer, calculateScore } from '../quiz-core';

export function useQuiz() {
  const [currentQuestion, setCurrentQuestion] = useAtom(currentQuestionAtom);
  const [revealedHintCount, setRevealedHintCount] = useAtom(revealedHintCountAtom);
  const [answered, setAnswered] = useAtom(answeredAtom);
  const [correct, setCorrect] = useAtom(correctAtom);
  const [score, setScore] = useAtom(scoreAtom);
  const [allStudents] = useAtom(allStudentsAtom);
  const [answerFeedback, setAnswerFeedback] = useState<string | null>(null);

  /**
   * 次のヒントを開示
   */
  const revealNextHint = useCallback(() => {
    if (!currentQuestion) return;
    if (answered) return;
    if (revealedHintCount > currentQuestion.hints.length) return;

    setRevealedHintCount((prev) => prev + 1);
  }, [currentQuestion, answered, revealedHintCount, setRevealedHintCount]);

  /**
   * 回答を提出
   */
  const submitAnswer = useCallback(
    (answer: string) => {
      if (!currentQuestion) return;
      if (answered) return;

      const result = validateAnswer(answer, currentQuestion.student, allStudents);

      if (result.type === 'correct') {
        // 正解
        const calculatedScore = calculateScore(revealedHintCount, true);
        setCorrect(true);
        setScore(calculatedScore);
        setAnswered(true);
        setAnswerFeedback(null);
      } else if (result.type === 'wrong_student') {
        // 存在する生徒だが間違い → 0点で終了
        setCorrect(false);
        setScore(0);
        setAnswered(true);
        setAnswerFeedback(null);
      } else {
        // 該当する生徒が存在しない → 続行可能
        setAnswerFeedback('該当する生徒が見つかりません');
      }
    },
    [currentQuestion, answered, revealedHintCount, allStudents, setCorrect, setScore, setAnswered]
  );

  /**
   * ギブアップ
   */
  const giveUp = useCallback(() => {
    if (!currentQuestion) return;
    if (answered) return;

    setCorrect(false);
    setScore(0);
    setAnswered(true);
    setAnswerFeedback(null);
  }, [currentQuestion, answered, setCorrect, setScore, setAnswered]);

  /**
   * クイズをリセット
   */
  const resetQuiz = useCallback(() => {
    setCurrentQuestion(null);
    setRevealedHintCount(1); // 最初から1つヒントを表示
    setAnswered(false);
    setCorrect(false);
    setScore(10); // 初期スコア（1ヒントで正解時の点数）
    setAnswerFeedback(null);
  }, [setCurrentQuestion, setRevealedHintCount, setAnswered, setCorrect, setScore]);

  return {
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
  };
}
