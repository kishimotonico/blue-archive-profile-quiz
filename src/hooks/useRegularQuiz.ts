import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { useQuiz } from './useQuiz';
import { getRandomStudents, createQuizQuestion, loadStudents } from '../quiz-core';
import { allStudentsAtom } from '../store/quiz';
import type { Student } from '../quiz-core';

const TOTAL_QUESTIONS = 10;

export function useRegularQuiz() {
  const quiz = useQuiz();
  const { score, answered, resetQuiz, setCurrentQuestion } = quiz;

  const setAllStudents = useSetAtom(allStudentsAtom);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);

  const totalScore = scores.reduce((sum, s) => sum + s, 0);

  // 初期化
  useEffect(() => {
    let cancelled = false;
    const initQuiz = async () => {
      resetQuiz();
      const allStudents = await loadStudents();
      if (cancelled) return;
      setAllStudents(allStudents);
      const randomStudents = await getRandomStudents(TOTAL_QUESTIONS);
      if (cancelled) return;
      setStudents(randomStudents);
      if (randomStudents.length > 0) {
        setCurrentQuestion(createQuizQuestion(randomStudents[0]));
      }
      setLoading(false);
    };
    initQuiz();
    return () => { cancelled = true; resetQuiz(); };
  }, [setCurrentQuestion, resetQuiz, setAllStudents]);

  // スコアを追加して次の問題へ、または結果画面へ
  const goNext = useCallback(() => {
    if (!answered) return;
    const newScores = [...scores, score];
    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < students.length) {
      setScores(newScores);
      setCurrentQuestionIndex(nextIndex);
      resetQuiz();
      setCurrentQuestion(createQuizQuestion(students[nextIndex]));
    } else {
      navigate('/result', {
        state: {
          totalScore: newScores.reduce((sum, s) => sum + s, 0),
          scores: newScores,
          totalQuestions: TOTAL_QUESTIONS,
        },
      });
    }
  }, [answered, scores, score, currentQuestionIndex, students, resetQuiz, setCurrentQuestion, navigate]);

  return {
    ...quiz,
    loading,
    currentQuestionIndex,
    totalScore,
    goNext,
    TOTAL_QUESTIONS,
  };
}
