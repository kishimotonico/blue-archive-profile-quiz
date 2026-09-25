import { useCallback, useEffect, useReducer, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import {
  regularSessionReducer,
  getCurrentIndex,
  startRound,
  restoreRound,
  toRoundSnapshot,
  judgeSubmit,
  createQuestionSet,
  getDailyDate,
  CURRENT_ALGORITHM_VERSION,
  type RegularSession,
  type QuizKey,
  type SubmitOutcome,
} from "../quiz-core";
import { preloadPortraitImage } from "../components/quiz/portraitImageUrl";
import {
  loadRegularQuizProgress,
  saveRegularQuizProgress,
  clearRegularQuizProgress,
} from "../store/regular";
import { allStudentsAtom } from "../store/students";

const TOTAL_QUESTIONS = 10;

function generateMasterKey(): QuizKey {
  return {
    version: CURRENT_ALGORITHM_VERSION,
    baseDate: getDailyDate(),
    seed: Math.floor(Math.random() * 0x7fffffff),
  };
}

export function useRegularQuiz() {
  const [state, dispatch] = useReducer(regularSessionReducer, { status: "loading" });
  const allStudents = useAtomValue(allStudentsAtom);
  const navigate = useNavigate();
  const [answerFeedback, setAnswerFeedback] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stored = loadRegularQuizProgress();
        const key = stored ? stored.masterKey : generateMasterKey();
        const questions = await createQuestionSet(key, TOTAL_QUESTIONS);
        if (cancelled) return;

        questions.forEach((q) => preloadPortraitImage(q.student));

        const session: RegularSession = stored
          ? {
              masterKey: key,
              questions,
              results: stored.results,
              round: restoreRound(questions[getCurrentIndex("ready", stored)], stored.round),
            }
          : {
              masterKey: key,
              questions,
              results: [],
              round: startRound(questions[0]),
            };
        dispatch({ type: "loaded", session });
      } catch {
        if (!cancelled) dispatch({ type: "failed" });
      }
    })();

    return () => {
      cancelled = true;
    };
    // ロードはマウント時の1回だけ行う。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.status === "ready") {
      saveRegularQuizProgress({
        schemaVersion: 3,
        masterKey: state.session.masterKey,
        results: state.session.results,
        round: toRoundSnapshot(state.session.round),
      });
    } else if (state.status === "finished") {
      clearRegularQuizProgress();
      navigate("/result", { state: { results: state.session.results }, replace: true });
    }
  }, [state, navigate]);

  const reveal = useCallback(() => {
    dispatch({ type: "round", action: { type: "reveal" } });
  }, []);

  const submit = useCallback(
    (answer: string): SubmitOutcome => {
      if (state.status !== "ready") return "accepted";

      const judgement = judgeSubmit(state.session.round, answer, allStudents);
      if (judgement.type === "unknownStudent") {
        setAnswerFeedback("該当する生徒が見つかりません");
        setErrorKey((prev) => prev + 1);
        return "unknownStudent";
      }

      if (judgement.type !== "ignored") {
        dispatch({
          type: "round",
          action: { type: "submit", answer, correct: judgement.type === "correct" },
        });
      }
      setAnswerFeedback(null);
      return "accepted";
    },
    [state, allStudents],
  );

  const giveUp = useCallback(() => {
    dispatch({ type: "round", action: { type: "giveUp" } });
    setAnswerFeedback(null);
  }, []);

  const next = useCallback(() => {
    dispatch({ type: "next" });
    setAnswerFeedback(null);
  }, []);

  const view = (() => {
    if (state.status !== "ready" && state.status !== "finished") return null;
    const index = getCurrentIndex(state.status, state.session);
    return {
      questionId: String(index),
      round: state.session.round,
      index,
      totalScore: state.session.results.reduce((sum, r) => sum + r.score, 0),
    };
  })();

  return {
    state,
    view,
    totalQuestions: TOTAL_QUESTIONS,
    reveal,
    submit,
    giveUp,
    next,
    answerFeedback,
    errorKey,
  };
}
