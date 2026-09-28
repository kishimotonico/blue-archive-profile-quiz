import { useEffect, useRef, useState } from "react";
import type { PortraitState, Student } from "../../quiz-core";
import { getPortraitImageUrl, NO_IMAGE_URL } from "./portraitImageUrl";

interface MobilePortraitCardProps {
  student: Student;
  portraitState: PortraitState;
  className?: string;
}

// hidden中の枠の高さ。デスクトップの立ち絵パネルと違い縦に積むレイアウトなので、
// 「？」だけの間はヒント一覧を圧迫しない大きさに抑える
const COMPACT_HEIGHT = "112px";
const FULL_HEIGHT = "60dvh";

// 枠の下端と操作エリアの間に必ず残す余白。MobileQuizLayout側のスクロール領域の
// pb-4（16px）と揃えている
const MIN_BOTTOM_GAP = 16;

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// モバイルではヒント一覧の下に立ち絵を表示する。デスクトップの立ち絵パネルとは
// 切り抜き・スクロール挙動が異なるため、StudentPortrait とは別コンポーネントにしている
function MobilePortraitCard({ student, portraitState, className = "" }: MobilePortraitCardProps) {
  const portraitRef = useRef<HTMLDivElement>(null);
  const prevPortraitState = useRef(portraitState);
  const expanded = portraitState !== "hidden";
  const prevExpanded = useRef(expanded);
  // 復元などで最初から silhouette のときは、フェードインを待たずに見せる
  const [showSilhouette, setShowSilhouette] = useState(portraitState !== "hidden");

  useEffect(() => {
    const prevState = prevPortraitState.current;
    if (portraitState === "silhouette" && prevState === "hidden") {
      setShowSilhouette(false);
      requestAnimationFrame(() => {
        setShowSilhouette(true);
      });
    } else if (portraitState === "revealed") {
      setShowSilhouette(true);
      // silhouette→revealedでは枠自体の高さは変わらないが、回答後は操作エリア（下の
      // ボタン列）が自然な高さに変わるため、スクロール領域に見える範囲が動いて枠の下端が
      // 操作エリアに接する・わずかに隠れることがある。最小余白を割り込んだ分だけ
      // scrollByで補正することで、「既に余白があれば動かない」を保ったまま直せる
      if (prevState === "silhouette") {
        const el = portraitRef.current;
        const scrollParent = el?.closest<HTMLElement>(".overflow-y-auto");
        if (el && scrollParent && typeof scrollParent.scrollBy === "function") {
          const overflow =
            el.getBoundingClientRect().bottom +
            MIN_BOTTOM_GAP -
            scrollParent.getBoundingClientRect().bottom;
          if (overflow > 0) {
            scrollParent.scrollBy({ top: overflow, behavior: "smooth" });
          }
        }
      }
    } else if (portraitState === "hidden") {
      setShowSilhouette(false);
    }
    prevPortraitState.current = portraitState;
  }, [portraitState]);

  // スクロールは枠が hidden→silhouette/revealed で広がるときだけ行う。silhouette→revealed
  // では枠の高さが変わらず位置は既に合っているため何もしない（ここで再度スクロールすると
  // 広がる前の位置を基準にずれてしまう不具合の元だった）。
  // 広がりきる前にスクロールすると、まだ縮んだ枠を基準に位置がずれるため、高さの
  // transitionend を待ってから中央寄せする。reduced motion では transition 自体が無く
  // transitionend も飛ばないため、即座にスクロールする
  useEffect(() => {
    const wasExpanded = prevExpanded.current;
    prevExpanded.current = expanded;
    if (wasExpanded || !expanded) return;

    const el = portraitRef.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      el.scrollIntoView({ behavior: "auto", block: "center" });
      return;
    }

    const handleTransitionEnd = (e: TransitionEvent) => {
      if (e.propertyName !== "height" || e.target !== el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    el.addEventListener("transitionend", handleTransitionEnd);
    return () => el.removeEventListener("transitionend", handleTransitionEnd);
  }, [expanded]);

  return (
    <div
      ref={portraitRef}
      data-portrait
      style={{ height: expanded ? FULL_HEIGHT : COMPACT_HEIGHT }}
      className={`relative w-full overflow-hidden rounded-2xl border border-ba-border bg-white transition-[height] duration-500 motion-reduce:transition-none ${className}`}
    >
      {expanded ? (
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
      ) : (
        // 縮んだ状態でも広がった後と同じ枠（白地・border・rounded-2xl）を保つため、
        // ここでは背景を足さず「？」と補足文だけを枠の中央に置く
        <div
          aria-hidden="true"
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center"
        >
          <span className="text-4xl font-light text-ba-blue/40">?</span>
          <span className="text-xs text-ba-ink-soft">ヒントをすべて開くとシルエットが出ます</span>
        </div>
      )}
    </div>
  );
}

export default MobilePortraitCard;
