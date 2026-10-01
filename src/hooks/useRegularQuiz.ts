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
  summarizeResults,
  CURRENT_ALGORITHM_VERSION,
  type RegularSession,
  type RegularState,
  type QuizKey,
  type Student,
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

// sessionStorage の進捗有無で「復元」か「新規」かが決まる。この分岐は useReducer の遅延初期化に
// 閉じ込め、reducer 自体は round/next の委譲だけを知る純粋な状態機械のままにする。
function initRegularState(allStudents: Student[]): RegularState {
  const stored = loadRegularQuizProgress();
  const key = stored ? stored.masterKey : generateMasterKey();
  const questions = createQuestionSet(allStudents, key, TOTAL_QUESTIONS);

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
  return { status: "ready", session };
}

export function useRegularQuiz() {
  const allStudents = useAtomValue(allStudentsAtom);
  const navigate = useNavigate();

  const [state, dispatch] = useReducer(regularSessionReducer, allStudents, initRegularState);

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

  // 遷移は「次の問題へ」の操作の結果なので、状態を監視する effect ではなく、
  // reducer を先に評価してここで直接行う
  const next = () => {
    const nextState = regularSessionReducer(state, { type: "next" });
    if (nextState.status === "finished") {
      clearRegularQuizProgress();
      navigate("/result", { state: { results: nextState.session.results }, replace: true });
    }
    dispatch({ type: "next" });
  };

  const index = getCurrentIndex(state.status, state.session);
  const view = {
    questionId: String(index),
    round: state.session.round,
    index,
    totalScore: summarizeResults(state.session.results).totalScore,
  };

  return {
    view,
    totalQuestions: TOTAL_QUESTIONS,
    reveal,
    submit,
    giveUp,
    next,
  };
}
