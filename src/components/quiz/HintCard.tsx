import type { Hint } from "../../quiz-core";

interface HintCardProps {
  hint: Hint;
  revealed: boolean;
  justRevealed?: boolean;
  className?: string;
}

function HintCard({ hint, revealed, justRevealed = false, className = "" }: HintCardProps) {
  return (
    <div
      className={`relative flex min-h-[84px] flex-col justify-center gap-1.5 overflow-hidden rounded-2xl border px-3.5 py-2.5 text-left ${
        revealed ? "border-ba-blue/40 bg-white" : "border-transparent bg-ba-sky-1/60"
      } transition-[background-color,border-color] duration-500 motion-reduce:transition-none starting:border-transparent starting:bg-ba-sky-1/60 ${justRevealed ? "ba-shine" : ""} ${className}`}
    >
      {/* 未開示との差は背景色（bg-ba-sky-1/60 vs bg-white）で付けており、
          文字色自体は不透明度を下げるとAAコントラストを割るため両方とも同じ濃さにする */}
      <span className="text-xs font-bold text-ba-ink-soft">{hint.label}</span>
      {/* 未開示でも値の行ぶんの高さを確保し、開示前後でラベル位置がずれないようにする */}
      <span
        className={`text-sm font-bold leading-snug text-ba-navy transition-opacity duration-500 motion-reduce:transition-none starting:opacity-0 lg:text-base ${
          revealed ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden={!revealed}
      >
        {revealed ? hint.value : "\u3000"}
      </span>
    </div>
  );
}

export default HintCard;
