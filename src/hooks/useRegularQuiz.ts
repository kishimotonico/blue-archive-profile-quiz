import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSetAtom } from "jotai";
import { useQuiz } from "./useQuiz";
import {
  createQuestionSet,
  loadStudents,
  getDailyDate,
  CURRENT_ALGORITHM_VERSION,
} from "../quiz-core";
import { preloadPortraitImage } from "../components/quiz/portraitImageUrl";
import { allStudentsAtom } from "../store/quiz";
import type { QuizQuestion } from "../quiz-core";

const TOTAL_QUESTIONS = 10;

export function useRegularQuiz() {
  const quiz = useQuiz();
  const { score, answered, resetQuiz, setCurrentQuestion } = quiz;

  const setAllStudents = useSetAtom(allStudentsAtom);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);

  const totalScore = scores.reduce((sum, s) => sum + s, 0);

  useEffect(() => {
    let cancelled = false;
    const initQuiz = async () => {
      resetQuiz();
      const allStudents = await loadStudents();
      if (cancelled) return;
      setAllStudents(allStudents);

      // マスターシードを生成してフリープレイセットを一括生成
      const masterSeed = Math.floor(Math.random() * 0x7fffffff);
      const masterKey = {
        version: CURRENT_ALGORITHM_VERSION,
        baseDate: getDailyDate(),
        seed: masterSeed,
      };
      const generatedQuestions = await createQuestionSet(masterKey, TOTAL_QUESTIONS);
      if (cancelled) return;
      // 全問の立ち絵を非同期で事前読み込み（DOM をブロックしない）
      generatedQuestions.forEach((q) => preloadPortraitImage(q.student));
      setQuestions(generatedQuestions);
      if (generatedQuestions.length > 0) {
        setCurrentQuestion(generatedQuestions[0]);
      }
      setLoading(false);
    };
    initQuiz();
    return () => {
      cancelled = true;
      resetQuiz();
    };
  }, [setCurrentQuestion, resetQuiz, setAllStudents]);

  const goNext = useCallback(() => {
    if (!answered) return;
    const newScores = [...scores, score];
    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < questions.length) {
      setScores(newScores);
      setCurrentQuestionIndex(nextIndex);
      resetQuiz();
      setCurrentQuestion(questions[nextIndex]);
    } else {
      navigate("/result", {
        state: {
          totalScore: newScores.reduce((sum, s) => sum + s, 0),
          scores: newScores,
          totalQuestions: TOTAL_QUESTIONS,
        },
      });
    }
  }, [
    answered,
    scores,
    score,
    currentQuestionIndex,
    questions,
    resetQuiz,
    setCurrentQuestion,
    navigate,
  ]);

  return {
    ...quiz,
    loading,
    currentQuestionIndex,
    totalScore,
    goNext,
    TOTAL_QUESTIONS,
  };
}
