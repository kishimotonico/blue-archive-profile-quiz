import { useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useIsDesktop } from "../../hooks/useIsDesktop";
import type { RoundState, SubmitOutcome } from "../../quiz-core";
import DesktopQuizLayout from "./DesktopQuizLayout";
import MobileQuizLayout from "./MobileQuizLayout";
import type { AfterAnswer, AnswerDraft, AnswerFeedbackError, QuizActions } from "./quizLayoutTypes";

const ERROR_MESSAGE = "該当する生徒が見つかりません";
const ERROR_VISIBLE_DURATION_MS = 3500;

interface QuizBodyProps {
  modeLabel: string;
  heading: ReactNode;
  round: RoundState;
  actions: QuizActions;
  afterAnswer: AfterAnswer;
}

// 回答欄の下書きとエラー表示状態をここで持つ。QuizScreen 側で key={questionId} を付けて
// 問題が変わるたびに作り直しているため、画面幅が変わってレイアウトが切り替わっても下書きは残る
function QuizBody({ modeLabel, heading, round, actions, afterAnswer }: QuizBodyProps) {
  const isDesktop = useIsDesktop();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<AnswerFeedbackError | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  // 演出は「この画面で今回答した」ときだけ出す。完了済みの再表示や途中復元は最初から answered なので出さない
  const [answeredInThisView, setAnsweredInThisView] = useState(false);

  useEffect(() => {
    return () => clearTimeout(errorTimerRef.current);
  }, []);

  const showError = () => {
    clearTimeout(errorTimerRef.current);
    setError((prev) => ({ message: ERROR_MESSAGE, attempt: (prev?.attempt ?? 0) + 1 }));
    errorTimerRef.current = setTimeout(() => setError(null), ERROR_VISIBLE_DURATION_MS);
  };

  const dismissError = () => {
    clearTimeout(errorTimerRef.current);
    setError(null);
  };

  const handleChange = (value: string) => {
    setDraft(value);
    dismissError();
  };

  // flushSyncで確定させないと、ボタンがまだinvisibleのままでfocus()が効かない。
  // answeredInThisView も同じ flushSync で確定させ、回答後の面が見えるのと同じ描画で演出を始める
  // （後から更新すると、演出の初期状態が出る前に文字が一瞬見える）
  const handleSubmit = (): SubmitOutcome => {
    let outcome!: SubmitOutcome;
    flushSync(() => {
      outcome = actions.submit(draft.trim());
      if (outcome === "accepted") setAnsweredInThisView(true);
    });
    if (outcome === "accepted") {
      setDraft("");
      dismissError();
      primaryButtonRef.current?.focus();
    } else {
      showError();
    }
    return outcome;
  };

  // giveUpは押せる時点で必ず回答確定（answered）に進む操作なので、判定なしでフォーカスしてよい
  const handleGiveUp = () => {
    flushSync(() => {
      actions.giveUp();
      setAnsweredInThisView(true);
    });
    primaryButtonRef.current?.focus();
  };

  const answer: AnswerDraft = {
    value: draft,
    onChange: handleChange,
    onSubmit: handleSubmit,
    error,
    dismissError,
  };

  const celebrate = answeredInThisView && round.status === "answered" && round.result.correct;

  const layoutProps = {
    modeLabel,
    heading,
    round,
    actions: { reveal: actions.reveal, giveUp: handleGiveUp },
    answer,
    afterAnswer,
    celebrate,
    primaryButtonRef,
  };

  return isDesktop ? <DesktopQuizLayout {...layoutProps} /> : <MobileQuizLayout {...layoutProps} />;
}

export default QuizBody;
