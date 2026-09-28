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

  // この QuizBody インスタンス（＝1問）の最初のコミットかどうか。画面幅が変わって
  // Desktop/Mobileのレイアウトが再マウントされても、questionIdが同じ間は再度trueにならない。
  // レンダー本体で直接refを書き換えると、StrictModeの二重描画で最初のコミット前に
  // falseへ変わってしまうため、実際にコミットされた後のeffectで一度だけ倒す
  const isFirstRenderRef = useRef(true);
  const autoFocusOnMount = isFirstRenderRef.current;

  // タイマーの後始末に加え、マウント済みフラグをコミット後に倒す
  useEffect(() => {
    isFirstRenderRef.current = false;
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

  // flushSyncでactions.submit（controller側のdispatch）を同期的に確定させてから
  // primaryButtonRefを読むのは、回答確定でボタンがinert/invisibleでなくなったDOMを
  // 見てフォーカスしたいため（変化前のDOMのままだとinert要素にフォーカスできない）
  const handleSubmit = (): SubmitOutcome => {
    let outcome!: SubmitOutcome;
    flushSync(() => {
      outcome = actions.submit(draft.trim());
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
    flushSync(() => actions.giveUp());
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
    primaryButtonRef,
    autoFocusOnMount,
  };

  return isDesktop ? <DesktopQuizLayout {...layoutProps} /> : <MobileQuizLayout {...layoutProps} />;
}

export default QuizBody;
