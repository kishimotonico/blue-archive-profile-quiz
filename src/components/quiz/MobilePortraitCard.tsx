import type { RefObject } from "react";
import type { PortraitState, Student } from "../../quiz-core";
import { getPortraitImageUrl, NO_IMAGE_URL } from "./portraitImageUrl";

interface MobilePortraitCardProps {
  student: Student;
  portraitState: PortraitState;
  /** 回答後の立ち絵バッジの文言（正解／答え）の出し分け */
  correct: boolean;
  /** MobileQuizLayout が scrollIntoView の対象にする */
  containerRef: RefObject<HTMLDivElement | null>;
}

// デスクトップの StudentPortrait とは切り抜き・スクロール挙動が異なるため別コンポーネントにする
function MobilePortraitCard({
  student,
  portraitState,
  correct,
  containerRef,
}: MobilePortraitCardProps) {
  const expanded = portraitState !== "hidden";

  // 高さは即座に切り替え、見た目は clip-path の遷移で広げる。height を遷移させると img が毎フレーム
  // 再レイアウトされる。hidden 中は clip-path を遷移させない。dvh が変わると切り込みの値も変わり、
  // 下端が欠けて見えるため。
  // 展開時の高さの cqh は MobileQuizLayout のスクロール領域基準で、60dvh との小さい方にして低い端末でも
  // 上端が見切れないようにする。2rem は scroll-margin-bottom（1rem）とスクロール領域内側の下余白
  // （pb-4）の合計で、scrollIntoView した枠の上下に同じ1rem の隙間が残る
  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-2xl border duration-500 ease-out motion-reduce:transition-none [scroll-margin-bottom:1rem] [--portrait-compact-height:max(7rem,25dvh)] starting:[clip-path:inset(0_0_calc(100%_-_var(--portrait-compact-height))_0_round_1rem)] ${
        expanded
          ? "h-[min(60dvh,calc(100cqh_-_2rem))] [clip-path:inset(0_round_1rem)] transition-[background-color,border-color,clip-path] border-ba-border bg-white"
          : "h-(--portrait-compact-height) [clip-path:inset(0_0_calc(100%_-_var(--portrait-compact-height))_0_round_1rem)] transition-[background-color,border-color] border-transparent bg-ba-sky-1/60"
      }`}
    >
      {expanded ? (
        <img
          src={getPortraitImageUrl(student)}
          alt={portraitState === "revealed" ? student.fullName : "シルエット"}
          draggable={false}
          className={`absolute inset-0 h-full w-full object-contain transition-[opacity,filter] duration-500 select-none motion-reduce:transition-none starting:opacity-0 ${
            portraitState === "silhouette"
              ? "brightness-0 pointer-events-none opacity-50"
              : "opacity-100"
          }`}
          onError={(e) => {
            e.currentTarget.src = NO_IMAGE_URL;
          }}
        />
      ) : (
        // 縮んだ状態は10枚目の未開示ヒントカードに見せる
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-light text-ba-blue/40">?</span>
        </div>
      )}
      {portraitState === "revealed" && (
        <span className="absolute bottom-2 left-3 rounded-full bg-ba-blue px-3 py-1 text-xs font-bold text-white">
          {correct ? "正解" : "答え"}
        </span>
      )}
      {/* 10枚目のヒントのように見せるラベル。unmountすると枠が広がる演出と足並みが揃わないため、
          expanded後も不透明度だけ落として残す */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-0 top-0 px-3.5 py-2.5 text-xs font-bold text-ba-ink-soft transition-opacity duration-500 motion-reduce:transition-none ${
          expanded ? "opacity-0" : "opacity-100"
        }`}
      >
        シルエット
      </span>
    </div>
  );
}

export default MobilePortraitCard;
