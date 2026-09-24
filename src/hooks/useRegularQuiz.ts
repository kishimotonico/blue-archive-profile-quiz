import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSetAtom } from "jotai";
import { useQuiz } from "./useQuiz";
import { createQuestionSet, getDailyDate, CURRENT_ALGORITHM_VERSION } from "../quiz-core";
import type { QuestionResult, RoundSnapshot } from "../quiz-core";
import { preloadPortraitImage } from "../components/quiz/portraitImageUrl";
import {
  loadRegularQuizProgress,
  saveRegularQuizProgress,
  clearRegularQuizProgress,
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

    // 保存済みの round snapshot を個別 atom（answered/correct/score等）に反映する。
    // セッション全体を一つの状態として扱う reducer 化は次のタスクで行う。
    const applyRoundSnapshot = (round: RoundSnapshot) => {
      if (round.status === "playing") {
        setRevealedHintCount(round.revealedHintCount);
        return;
      }
      setRevealedHintCount(round.result.usedHintCount);
      setAnswered(true);
      setCorrect(round.result.correct);
      setScore(round.result.score);
      setLastConfirmedAnswer(round.result.userAnswer);
    };

    const initQuiz = async () => {
      resetQuiz();

      const stored = loadRegularQuizProgress();
      const key = stored ? stored.masterKey : generateMasterKey();

      const generatedQuestions = await createQuestionSet(key, TOTAL_QUESTIONS);
      if (cancelled) return;

      generatedQuestions.forEach((q) => preloadPortraitImage(q.student));
      setQuestions(generatedQuestions);
      setMasterKey(key);

      if (stored) {
        const safeIndex = Math.min(stored.index, generatedQuestions.length - 1);
        setCurrentQuestionIndex(safeIndex);
        setResults(stored.results);
        setCurrentQuestion(generatedQuestions[safeIndex]);
        applyRoundSnapshot(stored.round);
      } else {
        const freshProgress: RegularQuizProgress = {
          schemaVersion: 3,
          masterKey: key,
          index: 0,
          results: [],
          round: { status: "playing", revealedHintCount: 1 },
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
    const round: RoundSnapshot = answered
      ? {
          status: "answered",
          result: {
            studentId: questions[currentQuestionIndex]?.student.id ?? "",
            usedHintCount: revealedHintCount,
            correct,
            userAnswer: lastConfirmedAnswer,
            score,
          },
        }
      : { status: "playing", revealedHintCount };

    saveRegularQuizProgress({
      schemaVersion: 3,
      masterKey,
      index: currentQuestionIndex,
      results,
      round,
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
    questions,
  ]);

  const goNext = useCallback(() => {
    if (!answered) return;
    if (!quiz.currentQuestion) return;

    const qr: QuestionResult = {
      studentId: quiz.currentQuestion.student.id,
      usedHintCount: revealedHintCount,
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
