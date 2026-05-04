import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSetAtom } from "jotai";
import { useQuiz } from "./useQuiz";
import {
  createQuestionSet,
  getDailyDate,
  CURRENT_ALGORITHM_VERSION,
} from "../quiz-core";
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
    setCurrentQuestion,
    setRevealedHintCount,
    resetQuiz,
  } = quiz;

  const setAnswered = useSetAtom(answeredAtom);
  const setCorrect = useSetAtom(correctAtom);
  const setScore = useSetAtom(scoreAtom);

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [masterKey, setMasterKey] = useState<QuizKey | null>(null);

  const totalScore = scores.reduce((sum, s) => sum + s, 0);

  useEffect(() => {
    let cancelled = false;
    const initQuiz = async () => {
      resetQuiz();

      const stored = loadRegularQuizProgress();
      let restored = stored && stored.totalQuestions === TOTAL_QUESTIONS ? stored : null;
      let key = restored ? restored.masterKey : generateMasterKey();

      // 二段防衛: loadRegularQuizProgress で version/shape を検証済みだが、
      // createQuestionSet 自体が将来的に再生成不可能になった場合（例: 生徒プールが
      // baseDate に対応する availableFrom を満たさない等）に備え、失敗時は新規開始。
      let generatedQuestions: QuizQuestion[];
      try {
        generatedQuestions = await createQuestionSet(key, TOTAL_QUESTIONS);
      } catch (err) {
        if (cancelled) return;
        if (!restored) throw err;
        console.warn("createQuestionSet failed for stored progress, restarting:", err);
        clearRegularQuizProgress();
        restored = null;
        key = generateMasterKey();
        generatedQuestions = await createQuestionSet(key, TOTAL_QUESTIONS);
      }
      if (cancelled) return;

      generatedQuestions.forEach((q) => preloadPortraitImage(q.student));
      setQuestions(generatedQuestions);
      setMasterKey(key);

      if (restored) {
        const safeIndex = Math.min(restored.currentQuestionIndex, generatedQuestions.length - 1);
        setCurrentQuestionIndex(safeIndex);
        setScores(restored.scores);
        setCurrentQuestion(generatedQuestions[safeIndex]);
        setRevealedHintCount(restored.currentQuestionState.revealedHintCount);
        setAnswered(restored.currentQuestionState.answered);
        setCorrect(restored.currentQuestionState.correct);
        setScore(restored.currentQuestionState.score);
      } else {
        const freshProgress: RegularQuizProgress = {
          masterKey: key,
          totalQuestions: TOTAL_QUESTIONS,
          currentQuestionIndex: 0,
          scores: [],
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
      masterKey,
      totalQuestions: TOTAL_QUESTIONS,
      currentQuestionIndex,
      scores,
      currentQuestionState: { revealedHintCount, answered, correct, score },
    });
  }, [
    loading,
    masterKey,
    currentQuestionIndex,
    scores,
    revealedHintCount,
    answered,
    correct,
    score,
  ]);

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
      // 全問終了 → 進捗をクリアしてから結果画面へ
      clearRegularQuizProgress();
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
