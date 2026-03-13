import { useState, useEffect, type FormEvent } from "react";
import { motion, useAnimationControls } from "motion/react";
import Button from "../common/Button";

interface AnswerInputProps {
  onSubmit: (answer: string) => void;
  disabled?: boolean;
  error?: string | null;
  errorKey?: number;
}

function AnswerInput({ onSubmit, disabled = false, error, errorKey }: AnswerInputProps) {
  const [answer, setAnswer] = useState("");
  const [showError, setShowError] = useState(false);
  const controls = useAnimationControls();

  useEffect(() => {
    // errorKey が 0（初期値 or リセット後）のときは何もしない
    if (!errorKey) return;
    setShowError(true);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    controls.start({ x: [0, -8, 8, -6, 6, -4, 4, 0], transition: { duration: 0.4 } });
  }, [errorKey]); // controls は安定した参照だが依存配列から除外してeffectの誤再実行を防ぐ

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (answer.trim()) {
      onSubmit(answer.trim());
      setAnswer("");
    }
  };

  const inputClass = [
    "flex-1 min-w-0 px-4 py-3 border-2 rounded-lg focus:outline-none disabled:bg-gray-100 text-center transition-colors duration-200",
    showError
      ? "border-red-500 bg-red-50 focus:border-red-600"
      : "border-gray-300 focus:border-blue-500",
  ].join(" ");

  return (
    <div className="relative w-full">
      <motion.div animate={controls} className="flex gap-2 w-full">
        <form onSubmit={handleSubmit} className="flex gap-2 w-full">
          <input
            type="text"
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              setShowError(false);
            }}
            placeholder="生徒名を入力"
            disabled={disabled}
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            className={inputClass}
          />
          <Button type="submit" disabled={disabled || !answer.trim()}>
            回答
          </Button>
        </form>
      </motion.div>

      {showError && error && (
        <div
          className="absolute left-0 bottom-full mb-2 z-10 max-w-xs cursor-pointer"
          onClick={() => setShowError(false)}
        >
          <div className="bg-red-50 border border-red-300 text-red-600 text-xs font-semibold rounded-lg px-3 py-1.5 shadow-sm whitespace-nowrap">
            {error}
          </div>
          {/* 吹き出し三角形（下向き） */}
          <div className="ml-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-300" />
        </div>
      )}
    </div>
  );
}

export default AnswerInput;
