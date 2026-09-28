import { useRef, useEffect, useState, type CSSProperties } from "react";
import type { Hint } from "../../quiz-core";
import HintCard from "./HintCard";
import { HINT_CARD_MIN_HEIGHT_PX, HINT_GRID_GAP_PX } from "./hintDimensions";

const HINT_ROW_MAX_HEIGHT = 128;

interface HintListProps {
  hints: Hint[];
  visibleCount: number;
  /**
   * 開示のきらめき・スクロール演出を再生するか。playing 中の開示数増加だけを対象にし、
   * 回答確定で全ヒントが一度に開くときは演出しない
   */
  animateReveal: boolean;
  /** "desktop" では常に全件を描画し、2列グリッドで高さを揃える。"mobile" では開示済み分だけ描画する */
  layout: "desktop" | "mobile";
}

function HintList({ hints, visibleCount, animateReveal, layout }: HintListProps) {
  const isMobileLayout = layout === "mobile";
  const hintRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevVisibleCount = useRef(visibleCount);
  const [justRevealedIndex, setJustRevealedIndex] = useState<number | null>(null);

  useEffect(() => {
    const increased = animateReveal && visibleCount > prevVisibleCount.current;
    prevVisibleCount.current = visibleCount;
    if (!increased || visibleCount > hints.length) return;

    const targetRef = hintRefs.current[visibleCount - 1];
    targetRef?.scrollIntoView({ behavior: "smooth", block: "center" });
    setJustRevealedIndex(visibleCount - 1);
    const timer = setTimeout(() => setJustRevealedIndex(null), 750);
    return () => clearTimeout(timer);
  }, [visibleCount, hints.length, animateReveal]);

  const visibleHints = isMobileLayout ? hints.slice(0, visibleCount) : hints;
  const remaining = hints.length - visibleCount;
  const peekCount = visibleCount % 2 === 1 ? 3 : 2;
  const peekHints = isMobileLayout ? hints.slice(visibleCount, visibleCount + peekCount) : [];

  // 縦長画面で下に空白が残らないよう、グリッドを左カラムの高さまで伸ばす。
  // 1行あたり HINT_ROW_MAX_HEIGHT を超える分は伸ばさず、下の余白として残す
  const desktopRows = Math.ceil(hints.length / 2);
  const desktopGridStyle = !isMobileLayout
    ? ({
        "--hint-grid-rows": `repeat(${desktopRows}, minmax(${HINT_CARD_MIN_HEIGHT_PX}px, 1fr))`,
        "--hint-grid-max-h": `calc(${desktopRows} * ${HINT_ROW_MAX_HEIGHT}px + ${desktopRows - 1} * ${HINT_GRID_GAP_PX}px)`,
      } as CSSProperties)
    : undefined;

  return (
    <div className={!isMobileLayout ? "lg:h-full" : undefined}>
      <div
        className={`grid grid-cols-1 gap-2 md:grid-cols-2 ${
          !isMobileLayout
            ? "lg:h-full lg:max-h-(--hint-grid-max-h) lg:grid-rows-(--hint-grid-rows)"
            : ""
        }`}
        style={desktopGridStyle}
      >
        {visibleHints.map((hint, index) => (
          <div
            key={index}
            ref={(el) => {
              hintRefs.current[index] = el;
            }}
          >
            <HintCard
              hint={hint}
              revealed={index < visibleCount}
              justRevealed={index === justRevealedIndex}
              className={!isMobileLayout ? "lg:h-full" : undefined}
            />
          </div>
        ))}
        {/* 2列表示（md以上）では、開示済みが奇数枚のとき最後の行の空きマスも埋めて行を揃えるため、
            見切れカードは1枚多く出す。1列表示では3枚目を隠す */}
        {peekHints.map((hint, i) => (
          <div
            key={visibleCount + i}
            className={`pointer-events-none ${i >= 2 ? "hidden md:block" : ""}`}
          >
            <HintCard hint={hint} revealed={false} />
          </div>
        ))}
        {isMobileLayout && remaining >= 2 && (
          <div className="pointer-events-none relative col-span-full -mt-20 flex h-20 items-end justify-center bg-linear-to-b from-transparent to-ba-bg to-85% pb-1 text-xs text-ba-ink-soft">
            残り {remaining} ヒント
          </div>
        )}
      </div>
    </div>
  );
}

export default HintList;
