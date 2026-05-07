import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSetAtom } from "jotai";
import { useQuiz } from "./useQuiz";
import {
  createQuestionSet,
  getDailyDate,
  CURRENT_ALGORITHM_VERSION,
} from "../quiz-core";
import type { QuestionResult } from "../quiz-core";
import { preloadPortraitImage } from "../components/quiz/portraitImageUrl";
import {
  loadRegularQuizProgress,
  saveRegularQuizProgress,
  clearRegularQuizProgress,
  DEFAULT_CURRENT_QUESTION_STATE,
  type RegularQuizProgress,
} from "../store/regular";
import { answeredAtom, correctAtom, scoreAtom } from "../store/quiz";
import type { QuizQuestion, QuizKey } from "../quiz-core";

const TOTAL_QUESTIONS = 10;

function generateMasterKey(): QuizKey {
  return {
    version: CURRENT_ALGORITHM_VERSION,
    baseDate: getDailyDate(),
    seed: Math.floor(Math.random() * 0x7fffffff),
  };
}

export function useRegularQuiz() {
  const quiz = useQuiz();
  const {
    revealedHintCount,
    answered,
    correct,
    score,
    lastConfirmedAnswer,
    setCurrentQuestion,
    setRevealedHintCount,
    setLastConfirmedAnswer,
    resetQuiz,
  } = quiz;

  const setAnswered = useSetAtom(answeredAtom);
  const setCorrect = useSetAtom(correctAtom);
  const setScore = useSetAtom(scoreAtom);

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [masterKey, setMasterKey] = useState<QuizKey | null>(null);

  const totalScore = results.reduce((sum, r) => sum + r.score, 0);

  useEffect(() => {
    let cancelled = false;
    const initQuiz = async () => {
      resetQuiz();

      const stored = loadRegularQuizProgress();
      const restored = stored && stored.totalQuestions === TOTAL_QUESTIONS ? stored : null;
      const key = restored ? restored.masterKey : generateMasterKey();

      const generatedQuestions = await createQuestionSet(key, TOTAL_QUESTIONS);
      if (cancelled) return;

      generatedQuestions.forEach((q) => preloadPortraitImage(q.student));
      setQuestions(generatedQuestions);
      setMasterKey(key);

      if (restored) {
        const safeIndex = Math.min(restored.currentQuestionIndex, generatedQuestions.length - 1);
        setCurrentQuestionIndex(safeIndex);
        setResults(restored.results);
        setCurrentQuestion(generatedQuestions[safeIndex]);
        setRevealedHintCount(restored.currentQuestionState.revealedHintCount);
        setAnswered(restored.currentQuestionState.answered);
        setCorrect(restored.currentQuestionState.correct);
        setScore(restored.currentQuestionState.score);
        setLastConfirmedAnswer(restored.currentQuestionState.lastConfirmedAnswer);
      } else {
        const freshProgress: RegularQuizProgress = {
          schemaVersion: 2,
          masterKey: key,
          totalQuestions: TOTAL_QUESTIONS,
          currentQuestionIndex: 0,
          results: [],
          currentQuestionState: DEFAULT_CURRENT_QUESTION_STATE,
        };
        saveRegularQuizProgress(freshProgress);
        if (generatedQuestions.length > 0) {
          setCurrentQuestion(generatedQuestions[0]);
        }
      }

      setLoading(false);
    };
    initQuiz();
    return () => {
      cancelled = true;
      resetQuiz();
    };
    // 初期化は1回だけ実行する。setter 群は安定しているが過度な依存を避けるため意図的に空配列。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 進行中の状態を sessionStorage に同期
  useEffect(() => {
    if (loading || !masterKey) return;
    saveRegularQuizProgress({
      schemaVersion: 2,
      masterKey,
      totalQuestions: TOTAL_QUESTIONS,
      currentQuestionIndex,
      results,
      currentQuestionState: { revealedHintCount, answered, correct, score, lastConfirmedAnswer },
    });
  }, [
    loading,
    masterKey,
    currentQuestionIndex,
    results,
    revealedHintCount,
    answered,
    correct,
    score,
    lastConfirmedAnswer,
  ]);

  const goNext = useCallback(() => {
    if (!answered) return;
    if (!quiz.currentQuestion) return;

    const qr: QuestionResult = {
      studentId: quiz.currentQuestion.student.id,
      revealedHintCount,
      correct,
      userAnswer: lastConfirmedAnswer,
      score,
    };
    const newResults = [...results, qr];
    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < questions.length) {
      setResults(newResults);
      setCurrentQuestionIndex(nextIndex);
      resetQuiz();
      setCurrentQuestion(questions[nextIndex]);
    } else {
      // 全問終了 → 進捗をクリアしてから結果画面へ
      clearRegularQuizProgress();
      navigate("/result", {
        state: {
          results: newResults,
        },
      });
    }
  }, [
    answered,
    quiz.currentQuestion,
    results,
    score,
    correct,
    revealedHintCount,
    lastConfirmedAnswer,
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
