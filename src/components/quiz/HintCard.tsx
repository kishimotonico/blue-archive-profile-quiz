import type { Hint } from "../../quiz-core";

interface HintCardProps {
  hint: Hint;
  revealed: boolean;
  /** 直前の操作で開示されたカードかどうか。trueの間だけシャイン演出を再生する */
  justRevealed?: boolean;
  className?: string;
}

/**
 * 開示済み/未開示で外形（サイズ・角丸・内側の余白・ラベル位置）を揃えたヒントカード。
 * ラベルを常に先頭に置くことで、将来カードを裏返す開示アニメーションを付けやすくしている。
 */
function HintCard({ hint, revealed, justRevealed = false, className = "" }: HintCardProps) {
  return (
    <div
      className={`relative flex min-h-[84px] flex-col justify-center gap-1.5 overflow-hidden rounded-2xl border px-3.5 py-2.5 text-left ${
        revealed ? "border-ba-blue/40 bg-white" : "border-transparent bg-ba-sky-1/60"
      } ${justRevealed ? "ba-shine" : ""} ${className}`}
    >
      <span
        className={`text-xs font-bold ${revealed ? "text-ba-ink-soft" : "text-ba-ink-soft/70"}`}
      >
        {hint.label}
      </span>
      {/* 未開示でも値の行ぶんの高さを確保し、開示前後でラベル位置がずれないようにする */}
      <span
        className={`text-sm font-bold leading-snug text-ba-navy lg:text-base ${revealed ? "" : "invisible"}`}
        aria-hidden={!revealed}
      >
        {revealed ? hint.value : "\u3000"}
      </span>
    </div>
  );
}

export default HintCard;
