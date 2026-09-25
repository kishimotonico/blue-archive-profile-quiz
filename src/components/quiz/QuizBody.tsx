import { useEffect, useRef, useState, type ReactNode } from "react";
import { useIsDesktop } from "../../hooks/useIsDesktop";
import type { RoundState } from "../../quiz-core";
import DesktopQuizLayout from "./DesktopQuizLayout";
import MobileQuizLayout from "./MobileQuizLayout";
import type { AfterAnswer, AnswerDraft, AnswerError, QuizActions } from "./quizLayoutTypes";

const ERROR_VISIBLE_DURATION_MS = 3500;

interface QuizBodyProps {
  modeLabel: string;
  heading: ReactNode;
  round: RoundState;
  actions: QuizActions;
  answerError: AnswerError;
  afterAnswer: AfterAnswer;
}

// 回答欄の下書きとエラー表示状態をここで持つ。QuizScreen 側で key={questionId} を付けて
// 問題が変わるたびに作り直しているため、画面幅が変わってレイアウトが切り替わっても下書きは残る
function QuizBody({ modeLabel, heading, round, actions, answerError, afterAnswer }: QuizBodyProps) {
  const isDesktop = useIsDesktop();
  const [draft, setDraft] = useState("");
  const [errorVisible, setErrorVisible] = useState(false);
  // 同じメッセージが続いても吹き出しとタイマーを出し直せるよう、表示のきっかけは message ではなく key の変化にする
  const prevErrorKeyRef = useRef(answerError.key);

  useEffect(() => {
    if (answerError.key === prevErrorKeyRef.current) return;
    prevErrorKeyRef.current = answerError.key;
    setErrorVisible(true);
    // 吹き出しは入力欄の上に重なって操作を塞ぐため、一定時間で自動的に閉じる
    const timer = setTimeout(() => setErrorVisible(false), ERROR_VISIBLE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [answerError.key]);

  const handleChange = (value: string) => {
    setDraft(value);
    setErrorVisible(false);
  };

  const handleSubmit = () => {
    if (!draft.trim()) return;
    const outcome = actions.submit(draft.trim());
    if (outcome === "accepted") setDraft("");
  };

  const answer: AnswerDraft = {
    value: draft,
    onChange: handleChange,
    onSubmit: handleSubmit,
    error: answerError,
    errorVisible,
    dismissError: () => setErrorVisible(false),
  };

  const layoutProps = {
    modeLabel,
    heading,
    round,
    actions: { reveal: actions.reveal, giveUp: actions.giveUp },
    answer,
    afterAnswer,
  };

  return isDesktop ? <DesktopQuizLayout {...layoutProps} /> : <MobileQuizLayout {...layoutProps} />;
}

export default QuizBody;
