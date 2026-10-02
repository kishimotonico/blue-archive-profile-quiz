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
  focusHintOnStart: boolean;
}

// 回答欄の下書きをここで持つのは、画面幅でレイアウトが切り替わっても残すため。
// 回答後の主ボタンへのフォーカスは handleSubmit / handleGiveUp だけが担う。autoFocus だと
// 完了済みの再表示や途中復元でも、操作していないのにフォーカス枠が出る
function QuizBody({
  modeLabel,
  heading,
  round,
  actions,
  afterAnswer,
  focusHintOnStart,
}: QuizBodyProps) {
  const isDesktop = useIsDesktop();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<AnswerFeedbackError | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  // 完了済みの再表示や途中復元は最初から answered なので、演出を出さないためにここで区別する
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

  // flushSync が無いと、ボタンが invisible のままで focus() が効かない。answeredInThisView も同じ
  // 描画で確定させる。後から更新すると、演出の初期状態より先に文字が一瞬見える
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

  // 諦めは必ず answered に進むので、submit と違って判定せずフォーカスする
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

  const layoutProps = {
    modeLabel,
    heading,
    round,
    actions: { reveal: actions.reveal, giveUp: handleGiveUp },
    answer,
    afterAnswer,
    justAnswered: answeredInThisView,
    focusHintOnStart,
    primaryButtonRef,
  };

  return isDesktop ? <DesktopQuizLayout {...layoutProps} /> : <MobileQuizLayout {...layoutProps} />;
}

export default QuizBody;
