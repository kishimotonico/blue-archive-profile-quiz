import { useEffect, useReducer } from "react";
import { useAtomValue, useSetAtom, useStore } from "jotai";
import {
  dailySessionReducer,
  startRound,
  restoreRound,
  judgeSubmit,
  createDailyQuestion,
  createQuestion,
  getDailyDate,
  type DailySession,
  type Student,
  type SubmitOutcome,
} from "../quiz-core";
import { preloadPortraitImage } from "../components/quiz/portraitImageUrl";
import {
  dailyHistoryAtom,
  dailyProgressAtom,
  recordDailyResultAtom,
  findDailyRecord,
} from "../store/daily";
import { allStudentsAtom } from "../store/students";

// 復元か新規かの分岐は reducer ではなく遅延初期化に置き、reducer を純粋なまま保つ
function initDailySession(store: ReturnType<typeof useStore>) {
  return (allStudents: Student[]): DailySession => {
    const today = getDailyDate();
    const todayRecord = findDailyRecord(store.get(dailyHistoryAtom), today);

    let session: DailySession;
    if (todayRecord) {
      const question = createQuestion(allStudents, todayRecord.key);
      session = {
        round: restoreRound(question, {
          status: "answered",
          // 同じ baseDate の記録が既にあり recordDailyResultAtom は何もしないので、この null は保存されない
          result: { ...todayRecord.result, userAnswer: todayRecord.result.userAnswer ?? null },
        }),
        completedOnLoad: true,
      };
    } else {
      const progress = store.get(dailyProgressAtom);
      if (progress && progress.key.baseDate === today) {
        const question = createQuestion(allStudents, progress.key);
        session = {
          round: restoreRound(question, {
            status: "playing",
            revealedHintCount: progress.revealedHintCount,
          }),
          completedOnLoad: false,
        };
      } else {
        const question = createDailyQuestion(allStudents);
        session = { round: startRound(question), completedOnLoad: false };
      }
    }

    preloadPortraitImage(session.round.question.student);
    return session;
  };
}

export function useDailyQuiz() {
  const allStudents = useAtomValue(allStudentsAtom);
  const store = useStore();
  const setDailyProgress = useSetAtom(dailyProgressAtom);
  const recordDailyResult = useSetAtom(recordDailyResultAtom);

  const [session, dispatch] = useReducer(dailySessionReducer, allStudents, initDailySession(store));

  useEffect(() => {
    const { round } = session;
    if (round.status === "playing") {
      setDailyProgress({ key: round.question.key, revealedHintCount: round.revealedHintCount });
    } else {
      // baseDate が既にあれば何もしないので、完了済みの再訪でも二重記録しない
      recordDailyResult({ key: round.question.key, result: round.result });
      setDailyProgress(null);
    }
  }, [session, setDailyProgress, recordDailyResult]);

  const reveal = () => {
    dispatch({ type: "reveal" });
  };

  const submit = (answer: string): SubmitOutcome => {
    const judgement = judgeSubmit(session.round, answer, allStudents);
    if (judgement.type === "unknownStudent") return "unknownStudent";

    if (judgement.type !== "ignored") {
      dispatch({ type: "submit", answer, correct: judgement.type === "correct" });
    }
    return "accepted";
  };

  const giveUp = () => {
    dispatch({ type: "giveUp" });
  };

  const view = {
    questionId: session.round.question.key.baseDate,
    round: session.round,
    completedOnLoad: session.completedOnLoad,
  };

  return {
    view,
    reveal,
    submit,
    giveUp,
  };
}
