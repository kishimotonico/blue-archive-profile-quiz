import { useEffect, useRef, useState } from "react";
import type { PortraitState, Student } from "../../quiz-core";
import { getPortraitImageUrl, NO_IMAGE_URL } from "./portraitImageUrl";

interface MobilePortraitCardProps {
  student: Student;
  portraitState: PortraitState;
  className?: string;
}

// モバイルではヒント一覧の下に立ち絵を表示する。デスクトップの立ち絵パネルとは
// 切り抜き・スクロール挙動が異なるため、StudentPortrait とは別コンポーネントにしている
function MobilePortraitCard({ student, portraitState, className = "" }: MobilePortraitCardProps) {
  const portraitRef = useRef<HTMLDivElement>(null);
  const prevPortraitState = useRef(portraitState);
  // 復元などで最初から silhouette のときは、フェードインを待たずに見せる
  const [showSilhouette, setShowSilhouette] = useState(portraitState !== "hidden");

  useEffect(() => {
    const prevState = prevPortraitState.current;
    if (portraitState === "silhouette" && prevState === "hidden") {
      portraitRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setShowSilhouette(false);
      requestAnimationFrame(() => {
        setShowSilhouette(true);
      });
    } else if (portraitState === "revealed") {
      // シルエットを経由せず hidden から直接 revealed になる場合も含め、
      // revealed への遷移直後は必ず立ち絵までスクロールする
      if (prevState !== "revealed") {
        portraitRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setShowSilhouette(true);
    } else if (portraitState === "hidden") {
      setShowSilhouette(false);
    }
    prevPortraitState.current = portraitState;
  }, [portraitState]);

  if (portraitState === "hidden") return null;

  return (
    <div
      ref={portraitRef}
      data-portrait
      className={`relative h-[60dvh] w-full overflow-hidden rounded-2xl border border-ba-border bg-white ${className}`}
    >
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
    </div>
  );
}

export default MobilePortraitCard;
