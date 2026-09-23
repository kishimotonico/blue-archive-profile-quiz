import type { Hint } from "../../quiz-core";

interface HintCardProps {
  hint: Hint;
  revealed: boolean;
  /** 開示時の獲得点数。指定時のみ右上にptチップを表示する */
  points?: number;
  /** 直前の操作で開示されたカードかどうか。trueの間だけシャイン演出を再生する */
  justRevealed?: boolean;
}

function HintCard({ hint, revealed, points, justRevealed = false }: HintCardProps) {
  if (!revealed) {
    return (
      <div className="flex min-h-[84px] flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-ba-sky-2 bg-ba-sky-1 px-3 py-2.5">
        <span className="text-[11px] font-bold text-ba-ink-soft">{hint.label}</span>
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
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-bold text-ba-ink-soft">{hint.label}</span>
        {points != null && (
          <span className="shrink-0 rounded-full border border-white bg-ba-yellow px-2 py-0.5 font-display text-[10px] font-black text-ba-navy shadow-sm">
            {points}pt
          </span>
        )}
      </div>
      <span className="text-sm font-bold leading-snug text-ba-navy">{hint.value}</span>
    </div>
  );
}

export default HintCard;
