import { useRef, useEffect, useState } from "react";
import type { Hint, Student, PortraitState } from "../../quiz-core";
import HintCard from "./HintCard";
import { getPortraitImageUrl, NO_IMAGE_URL } from "./portraitImageUrl";

interface HintListProps {
  hints: Hint[];
  revealedCount: number;
  student?: Student | null;
  portraitState?: PortraitState;
  /**
   * "mobile" のとき、開示済みヒントのみをグラデーションで見切れ表示しつつ、
   * グリッド内に立ち絵（シルエット/確定表示）を含める。
   * "desktop"（既定）は全ヒントを表示し、立ち絵はグリッドに含めない
   * （デスクトップでは右カラムに別途 StudentPortrait を表示するため）。
   */
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

  // ヒント開示時のスクロール処理＋シャイン演出の一時フラグ管理
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

  // シルエット表示時／立ち絵確定表示時のスクロール＋フェードイン処理
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
      // silhouette を経由せず hidden から直接 revealed になるケース（シルエット前に正解した場合）も含め、
      // revealed へ遷移した瞬間は必ず立ち絵までスクロールする
      if (prevState !== "revealed" && portraitRef.current) {
        portraitRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setShowSilhouette(true);
    } else if (portraitState === "hidden") {
      setShowSilhouette(false);
    }
    prevPortraitState.current = portraitState;
  }, [portraitState]);

  // mobile レイアウト: 開示済みヒントのみ表示し、未開示ヒントはグラデーションで見切れ表示
  const visibleHints = isMobileLayout ? hints.slice(0, revealedCount) : hints;
  const remaining = hints.length - revealedCount;
  const peekHints =
    isMobileLayout && remaining > 0
      ? hints.slice(revealedCount, revealedCount + Math.min(remaining, 3))
      : [];

  return (
    <div>
      <div className="ba-tag mb-2">
        <span>HINT LIST</span>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
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
            />
          </div>
        ))}
        {peekHints.length > 0 && (
          <div
            className={`relative overflow-hidden pointer-events-none ${peekHints.length >= 2 ? "max-h-44" : ""}`}
          >
            <div className="flex flex-col gap-2">
              {peekHints.map((hint, i) => (
                <HintCard key={revealedCount + i} hint={hint} revealed={false} />
              ))}
            </div>
            {peekHints.length >= 2 && (
              <div className="absolute inset-0 bg-linear-to-b from-transparent from-40% to-ba-bg to-85%" />
            )}
            {remaining >= 2 && (
              <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-ba-ink-soft pb-1">
                残り {remaining} ヒント
              </div>
            )}
          </div>
        )}
        {isMobileLayout && (
          <div
            ref={portraitRef}
            data-portrait
            className="relative col-span-full h-[60dvh] w-full overflow-hidden rounded-2xl border border-ba-border bg-white shadow-xs"
          >
            {/* ?プレースホルダー（hidden時に表示。デスクトップ右ペインと同じba-sky系の見た目） */}
            <div
              className={`absolute inset-0 flex items-center justify-center rounded-2xl border border-dashed border-ba-sky-2 bg-linear-to-b from-ba-sky-1 to-white transition-opacity duration-500 ${
                portraitState === "hidden" ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <span className="text-5xl font-light text-ba-blue/40">?</span>
            </div>
            {student && portraitState !== "hidden" && (
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
