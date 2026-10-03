import { useId, type FormEvent } from "react";
import { motion, useAnimationControls } from "motion/react";
import type { SubmitOutcome } from "../../quiz-core";
import Button from "../common/Button";
import type { AnswerFeedbackError } from "./quizLayoutTypes";

interface AnswerInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => SubmitOutcome;
  error: AnswerFeedbackError | null;
  onDismissError: () => void;
}

function AnswerInput({ value, onChange, onSubmit, error, onDismissError }: AnswerInputProps) {
  const controls = useAnimationControls();
  const errorId = useId();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    // effect で error の変化を監視せず、ここで再生する。key で作り直すと入力欄のフォーカスが外れる
    if (onSubmit() === "unknownStudent") {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      controls.start({ x: [0, -8, 8, -6, 6, -4, 4, 0], transition: { duration: 0.4 } });
    }
  };

  // focus-visible のリングは付けない。エラー時の赤枠と重なって二重枠になる
  const inputClass = [
    "flex-1 min-w-0 rounded-lg border-2 bg-ba-bg px-4 py-3 text-center font-semibold text-ba-navy transition-colors duration-200 placeholder:font-medium placeholder:text-ba-ink-soft focus:bg-white focus:outline-hidden disabled:bg-gray-100",
    error
      ? "border-ba-wrong bg-ba-wrong-soft focus:border-ba-wrong"
      : "border-ba-border focus:border-ba-blue",
  ].join(" ");

  const isAnswerEmpty = !value.trim();

  return (
    <div className="relative">
      <motion.form animate={controls} onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="answer-input" className="sr-only">
          生徒名
        </label>
        <input
          id="answer-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="生徒名を入力"
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
          aria-invalid={error !== null}
          aria-describedby={error ? errorId : undefined}
          className={inputClass}
        />
        <Button
          type="submit"
          variant={isAnswerEmpty ? "secondary" : "accent"}
          // 白地の secondary に disabled:opacity-50 が掛かると輪郭がほぼ消えて読めない
          className={`shrink-0 ${isAnswerEmpty ? "disabled:opacity-80!" : ""}`}
          disabled={isAnswerEmpty}
        >
          回答する
        </Button>
      </motion.form>

      {/* key で、同じ文言が続いても吹き出しを作り直し、スクリーンリーダーに再読み上げさせる */}
      {error && (
        <div
          key={error.attempt}
          id={errorId}
          role="alert"
          className="absolute left-0 bottom-full mb-2 z-10 w-full max-w-xs cursor-pointer"
          onClick={onDismissError}
        >
          <div className="bg-ba-wrong-soft border border-ba-wrong/40 text-ba-wrong text-xs font-semibold rounded-lg px-3 py-1.5 shadow-xs">
            {error.message}
          </div>
          <div className="ml-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-ba-wrong/40" />
        </div>
      )}
    </div>
  );
}

export default AnswerInput;
