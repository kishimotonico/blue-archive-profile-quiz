import { useCallback, useEffect, useReducer, useState } from "react";
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
} from "../quiz-core";
import { preloadPortraitImage } from "../components/quiz/portraitImageUrl";
import { dailyResultsStorageAtom, dailyProgressAtom, recordDailyResultAtom } from "../store/daily";
import { allStudentsAtom } from "../store/students";

type SubmitOutcome = "accepted" | "unknownStudent";

export function useDailyQuiz() {
  const [state, dispatch] = useReducer(dailySessionReducer, { status: "loading" });
  const allStudents = useAtomValue(allStudentsAtom);
  const store = useStore();
  const setDailyProgress = useSetAtom(dailyProgressAtom);
  const recordDailyResult = useSetAtom(recordDailyResultAtom);
  const [answerFeedback, setAnswerFeedback] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const today = getDailyDate();
        const todayResult = store
          .get(dailyResultsStorageAtom)
          .recent.find((r) => r.key.baseDate === today);

        let session: DailySession;
        if (todayResult) {
          const question = await createQuestion(todayResult.key);
          if (cancelled) return;
          session = {
            round: restoreRound(question, { status: "answered", result: todayResult.result }),
            completedOnLoad: true,
          };
        } else {
          const progress = store.get(dailyProgressAtom);
          if (progress && progress.key.baseDate === today) {
            const question = await createQuestion(progress.key);
            if (cancelled) return;
            session = {
              round: restoreRound(question, {
                status: "playing",
                revealedHintCount: progress.revealedHintCount,
              }),
              completedOnLoad: false,
            };
          } else {
            const question = await createDailyQuestion();
            if (cancelled) return;
            session = { round: startRound(question), completedOnLoad: false };
          }
        }

        preloadPortraitImage(session.round.question.student);
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
    if (state.status !== "ready") return;
    const { round } = state.session;
    if (round.status === "playing") {
      setDailyProgress({ key: round.question.key, revealedHintCount: round.revealedHintCount });
    } else {
      // baseDate が既にあれば何もしない冪等な書き込みなので、完了済みの再訪でも二重記録しない。
      recordDailyResult({ key: round.question.key, result: round.result });
      setDailyProgress(null);
    }
  }, [state, setDailyProgress, recordDailyResult]);

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

  const questionId = state.status === "ready" ? state.session.round.question.key.baseDate : null;

  return {
    state,
    questionId,
    reveal,
    submit,
    giveUp,
    answerFeedback,
    errorKey,
  };
}
