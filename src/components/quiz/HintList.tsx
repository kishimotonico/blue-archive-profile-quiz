import { useRef, useEffect, useState, type CSSProperties } from "react";
import type { Hint, Student, PortraitState } from "../../quiz-core";
import HintCard from "./HintCard";
import { getPortraitImageUrl, NO_IMAGE_URL } from "./portraitImageUrl";

const HINT_ROW_MAX_HEIGHT = 128;

interface HintListProps {
  hints: Hint[];
  revealedCount: number;
  student?: Student | null;
  portraitState?: PortraitState;
  /** "desktop" ではグリッドに立ち絵を含めない。右カラムに別途 StudentPortrait を表示するため */
  layout?: "desktop" | "mobile";
}

function HintList({
  hints,
  revealedCount,
  student,
  portraitState = "hidden",
  layout = "desktop",
}: HintListProps) {
  const isMobileLayout = layout === "mobile";
  const hintRefs = useRef<(HTMLDivElement | null)[]>([]);
  const portraitRef = useRef<HTMLDivElement>(null);
  const prevRevealedCount = useRef(revealedCount);
  const prevPortraitState = useRef(portraitState);
  const [showSilhouette, setShowSilhouette] = useState(false);
  const [justRevealedIndex, setJustRevealedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (revealedCount > prevRevealedCount.current && revealedCount <= hints.length) {
      const targetRef = hintRefs.current[revealedCount - 1];
      if (targetRef) {
        targetRef.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setJustRevealedIndex(revealedCount - 1);
      prevRevealedCount.current = revealedCount;
      const timer = setTimeout(() => setJustRevealedIndex(null), 750);
      return () => clearTimeout(timer);
    }
    prevRevealedCount.current = revealedCount;
  }, [revealedCount, hints.length]);

  useEffect(() => {
    const prevState = prevPortraitState.current;
    if (portraitState === "silhouette" && prevState === "hidden") {
      if (portraitRef.current) {
        portraitRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setShowSilhouette(false);
      requestAnimationFrame(() => {
        setShowSilhouette(true);
      });
    } else if (portraitState === "revealed") {
      // シルエットを経由せず hidden から直接 revealed になる場合も含め、
      // revealed への遷移直後は必ず立ち絵までスクロールする
      if (prevState !== "revealed" && portraitRef.current) {
        portraitRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setShowSilhouette(true);
    } else if (portraitState === "hidden") {
      setShowSilhouette(false);
    }
    prevPortraitState.current = portraitState;
  }, [portraitState]);

  const visibleHints = isMobileLayout ? hints.slice(0, revealedCount) : hints;
  const remaining = hints.length - revealedCount;
  const peekCount = revealedCount % 2 === 1 ? 3 : 2;
  const peekHints = isMobileLayout ? hints.slice(revealedCount, revealedCount + peekCount) : [];

  // 縦長画面で下に空白が残らないよう、グリッドを左カラムの高さまで伸ばす。
  // 1行あたり HINT_ROW_MAX_HEIGHT を超える分は伸ばさず、下の余白として残す
  const desktopRows = Math.ceil(hints.length / 2);
  const desktopGridStyle = !isMobileLayout
    ? ({
        "--hint-grid-rows": `repeat(${desktopRows}, minmax(84px, 1fr))`,
        "--hint-grid-max-h": `calc(${desktopRows} * ${HINT_ROW_MAX_HEIGHT}px + ${desktopRows - 1} * 0.5rem)`,
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
              revealed={index < revealedCount}
              justRevealed={index === justRevealedIndex}
              className={!isMobileLayout ? "lg:h-full" : undefined}
            />
          </div>
        ))}
        {/* 2列表示（md以上）では、開示済みが奇数枚のとき最後の行の空きマスも埋めて行を揃えるため、
            見切れカードは1枚多く出す。1列表示では3枚目を隠す */}
        {peekHints.map((hint, i) => (
          <div
            key={revealedCount + i}
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
        {isMobileLayout && portraitState !== "hidden" && (
          <div
            ref={portraitRef}
            data-portrait
            className="relative col-span-full h-[60dvh] w-full overflow-hidden rounded-2xl border border-ba-border bg-white"
          >
            {student && (
              <img
                src={getPortraitImageUrl(student)}
                alt={portraitState === "revealed" ? student.fullName : "シルエット"}
                draggable={false}
                className={`absolute inset-0 h-full w-full object-contain transition-all duration-500 select-none ${
                  portraitState === "silhouette"
                    ? showSilhouette
                      ? "opacity-50 brightness-0 pointer-events-none"
                      : "opacity-0 brightness-0 pointer-events-none"
                    : "opacity-100"
                }`}
                onError={(e) => {
                  e.currentTarget.src = NO_IMAGE_URL;
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HintList;
