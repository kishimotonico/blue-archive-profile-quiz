import type { Hint } from "../../quiz-core";

interface HintCardProps {
  hint: Hint;
  revealed: boolean;
  /** 直前の操作で開示されたカードかどうか。trueの間だけシャイン演出を再生する */
  justRevealed?: boolean;
}

function HintCard({ hint, revealed, justRevealed = false }: HintCardProps) {
  if (!revealed) {
    return (
      <div className="flex min-h-[84px] flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-ba-sky-2 bg-ba-sky-1 px-3 py-2.5">
        <span className="text-xs font-bold text-ba-navy">{hint.label}</span>
        <span className="text-lg leading-none text-ba-blue/50">?</span>
      </div>
    );
  }

  return (
    <div
      className={`relative flex min-h-[84px] flex-col justify-center gap-1.5 overflow-hidden rounded-2xl border border-ba-blue/40 bg-white px-3.5 py-2.5 shadow-xs ${
        justRevealed ? "ba-shine" : ""
      }`}
    >
      <span className="text-xs font-bold text-ba-ink-soft">{hint.label}</span>
      <span className="text-sm font-bold leading-snug text-ba-navy">{hint.value}</span>
    </div>
  );
}

export default HintCard;
