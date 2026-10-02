import type { RefObject } from "react";
import type { Hint } from "../../quiz-core";
import HintCard from "./HintCard";

interface HintListProps {
  hints: Hint[];
  visibleCount: number;
  /** プレイヤーが自分で開いた枚数。visibleCount との差は回答後に開いたヒントとして見分けがつく見た目にする */
  playerRevealedCount: number;
  /**
   * 直近の1枚にきらめきを付けるか。playing 中の開示だけが対象で、
   * 回答確定で全ヒントが一度に開くときは値のフェードだけにして、きらめきを重ねない
   */
  animateReveal: boolean;
  /** "desktop" では常に全件を描画し、2列グリッドで高さを揃える。"mobile" では開示済み分だけ描画する */
  layout: "desktop" | "mobile";
  /** 直近に開示したカードの要素。呼び出し側がscrollIntoViewするために渡す */
  justRevealedRef?: RefObject<HTMLDivElement | null>;
}

function HintList({
  hints,
  visibleCount,
  playerRevealedCount,
  animateReveal,
  layout,
  justRevealedRef,
}: HintListProps) {
  const isMobileLayout = layout === "mobile";
  const visibleHints = isMobileLayout ? hints.slice(0, visibleCount) : hints;
  const remaining = hints.length - visibleCount;
  const peekCount = visibleCount % 2 === 1 ? 3 : 2;
  const peekHints = isMobileLayout ? hints.slice(visibleCount, visibleCount + peekCount) : [];

  return (
    <div
      className={`grid grid-cols-1 gap-2 md:grid-cols-2 ${
        !isMobileLayout ? "lg:h-full lg:auto-rows-[minmax(84px,128px)] lg:content-start" : ""
      }`}
    >
      {visibleHints.map((hint, index) => (
        <HintCard
          key={index}
          ref={index === visibleCount - 1 ? justRevealedRef : undefined}
          hint={hint}
          revealed={index < visibleCount}
          revealedAfterAnswer={index >= playerRevealedCount && index < visibleCount}
          justRevealed={animateReveal && index === visibleCount - 1}
        />
      ))}
      {/* 2列（md以上）では奇数枚のとき最後の行の空きを埋めるため見切れカードを1枚多く出す */}
      {peekHints.map((hint, i) => (
        <HintCard
          key={visibleCount + i}
          hint={hint}
          revealed={false}
          className={`pointer-events-none ${i >= 2 ? "max-md:hidden" : ""}`}
        />
      ))}
      {isMobileLayout && remaining >= 2 && (
        <div className="pointer-events-none relative col-span-full -mt-20 flex h-20 items-end justify-center bg-linear-to-b from-transparent to-ba-bg to-85% pb-1 text-xs text-ba-ink-soft">
          残り {remaining} ヒント
        </div>
      )}
    </div>
  );
}

export default HintList;
