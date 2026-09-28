import { useEffect, useReducer } from "react";
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

  // 進捗（ready状態）のsessionStorageへの保存は、reducerの状態を外部ストレージへ写す同期なので
  // effectのままでよい。finishedへの遷移はユーザー操作（nextハンドラ）の結果なのでそちらへ移す
  useEffect(() => {
    if (state.status === "ready") {
      saveRegularQuizProgress({
        schemaVersion: 3,
        masterKey: state.session.masterKey,
        results: state.session.results,
        round: toRoundSnapshot(state.session.round),
      });
    }
  }, [state]);

  const reveal = () => {
    dispatch({ type: "round", action: { type: "reveal" } });
  };

  const submit = (answer: string): SubmitOutcome => {
    if (state.status !== "ready") return "accepted";

    const judgement = judgeSubmit(state.session.round, answer, allStudents);
    if (judgement.type === "unknownStudent") return "unknownStudent";

    if (judgement.type !== "ignored") {
      dispatch({
        type: "round",
        action: { type: "submit", answer, correct: judgement.type === "correct" },
      });
    }
    return "accepted";
  };

  const giveUp = () => {
    dispatch({ type: "round", action: { type: "giveUp" } });
  };

  // reducerは純粋関数なので、dispatchする前に同じ入力で先に評価して「finishedへ進むか」を
  // 判定できる。遷移はこの操作（「次の問題へ」を押した）の結果なので、状態を監視するeffectではなく
  // ここで直接行う
  const next = () => {
    if (state.status === "ready") {
      const nextState = regularSessionReducer(state, { type: "next" });
      if (nextState.status === "finished") {
        clearRegularQuizProgress();
        navigate("/result", { state: { results: nextState.session.results }, replace: true });
      }
    }
    dispatch({ type: "next" });
  };

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
  };
}
