import type { Ref } from "react";
import type { Hint } from "../../quiz-core";

interface HintCardProps {
  hint: Hint;
  revealed: boolean;
  justRevealed?: boolean;
  /** 回答後に開いたヒント。値は出すが、面は自分で開いたカード（白）と区別するため未開示のまま */
  revealedAfterAnswer?: boolean;
  className?: string;
  /** 呼び出し側がscrollIntoViewするために渡す */
  ref?: Ref<HTMLDivElement>;
}

function HintCard({
  hint,
  revealed,
  justRevealed = false,
  revealedAfterAnswer = false,
  className = "",
  ref,
}: HintCardProps) {
  const whiteFace = revealed && !revealedAfterAnswer;

  return (
    <div
      ref={ref}
      className={`relative flex min-h-[84px] flex-col justify-center gap-1.5 overflow-hidden rounded-2xl border px-3.5 py-2.5 text-left ${
        whiteFace ? "border-ba-blue/40 bg-white" : "border-transparent bg-ba-sky-1/60"
      } transition-[background-color,border-color] duration-500 motion-reduce:transition-none starting:border-transparent starting:bg-ba-sky-1/60 ${justRevealed ? "ba-shine" : ""} ${className}`}
    >
      {/* 文字色は不透明度を下げると AA を割るため、未開示との差は背景色だけで付ける（回答後に開いたカードも同じ理由で不透明度は触らず、太さと文字色で区別する） */}
      <span className="text-xs font-bold text-ba-ink-soft">{hint.label}</span>
      {/* 未開示でも値の行ぶんの高さを確保し、開示前後でラベル位置がずれないようにする */}
      <span
        className={`text-sm leading-snug transition-opacity duration-500 motion-reduce:transition-none starting:opacity-0 lg:text-base ${
          revealed ? "opacity-100" : "opacity-0"
        } ${revealedAfterAnswer ? "font-medium text-ba-ink-soft" : "font-bold text-ba-navy"}`}
        aria-hidden={!revealed}
      >
        {revealed ? hint.value : "\u3000"}
        {revealedAfterAnswer && <span className="sr-only">（回答後に開示）</span>}
      </span>
    </div>
  );
}

export default HintCard;
