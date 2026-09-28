import { useRef, type RefObject } from "react";
import type { PortraitState, Student } from "../../quiz-core";
import { getPortraitImageUrl, NO_IMAGE_URL } from "./portraitImageUrl";

interface MobilePortraitCardProps {
  student: Student;
  portraitState: PortraitState;
  /** 展開の瞬間に一度だけ scrollIntoView するため、呼び出し側（MobileQuizLayout）の
   * クリックハンドラから枠のDOMを参照できるようにする */
  containerRef: RefObject<HTMLDivElement | null>;
  className?: string;
}

// Tailwindの任意値はソース中の文字列をそのまま静的解析するため、クラス名は
// テンプレートで組み立てずリテラルで書く必要がある。下のクラス名中の値の根拠:
// - hidden中（「？」枠）の高さ（h-[max(7rem,25dvh)]）: 最低保証7rem(112px)に、
//   縦長画面では25dvhまで伸ばす。全ヒント開示時の行数から余りを見積もる方式をやめたため、
//   端末によっては全開示・最下部で枠の下に空白が残ることがあるが、それは許容する
// - 展開後の高さの上限（h-[min(60dvh,calc(100cqh_-_2rem))]）: 60dvhと、スクロール領域
//   自身の高さ（親のMobileQuizLayoutが container-type:size にしているため cqh で参照できる）
//   から余白ぶんを引いた値の小さい方を使い、低い端末で上端が見切れないようにする。
//   ヘッダーや操作エリアの高さを直接見積もる必要がなく、それらを変えてもこの値の見直しは不要

// モバイルではヒント一覧の下に立ち絵を表示する。デスクトップの立ち絵パネルとは
// 切り抜き・スクロール挙動が異なるため、StudentPortrait とは別コンポーネントにしている
function MobilePortraitCard({
  student,
  portraitState,
  containerRef,
  className = "",
}: MobilePortraitCardProps) {
  const expanded = portraitState !== "hidden";
  // 最初から silhouette/revealed で描画された（復元）場合は、枠が広がる演出・シルエットの
  // フェードインをどちらも再生しない。mount時の一度だけ判定すればよい値なので、
  // 再レンダーのたびに参照し直さないようrefに固定する
  const playGrowAnimationRef = useRef<boolean | null>(null);
  if (playGrowAnimationRef.current === null) {
    playGrowAnimationRef.current = portraitState === "hidden";
  }
  const playRevealAnimation = playGrowAnimationRef.current;

  return (
    <div
      ref={containerRef}
      data-portrait
      className={[
        "relative w-full overflow-hidden rounded-2xl border transition-[background-color,border-color] duration-500 motion-reduce:transition-none",
        // 枠の下端と操作エリアの間に残す隙間。回答前後で操作エリアの高さを揃えたため固定値で表せる
        "[scroll-margin-bottom:1rem]",
        // ba-portrait-grow（index.css）のクリップ開始値。hidden中の高さ（h-[max(7rem,25dvh)]）と揃える
        "[--portrait-compact-height:max(7rem,25dvh)]",
        expanded
          ? `h-[min(60dvh,calc(100cqh_-_2rem))] [clip-path:inset(0_round_1rem)] border-ba-border bg-white${
              playGrowAnimationRef.current ? " ba-portrait-grow" : ""
            }`
          : "h-[max(7rem,25dvh)] border-transparent bg-ba-sky-1/60",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {expanded ? (
        <img
          src={getPortraitImageUrl(student)}
          alt={portraitState === "revealed" ? student.fullName : "シルエット"}
          draggable={false}
          className={`absolute inset-0 h-full w-full object-contain transition-[opacity,filter] duration-500 select-none ${
            portraitState === "silhouette"
              ? `brightness-0 pointer-events-none ${
                  playRevealAnimation
                    ? "ba-silhouette-fadein motion-reduce:opacity-50"
                    : "opacity-50"
                }`
              : "opacity-100"
          }`}
          onError={(e) => {
            e.currentTarget.src = NO_IMAGE_URL;
          }}
        />
      ) : (
        // 縮んだ状態はヒント一覧の10枚目の未開示カードに見せたいため、
        // HintCard の未開示面（bg-ba-sky-1/60・枠なし）と同じ地の上に「？」だけを中央に置く
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-light text-ba-blue/40">?</span>
        </div>
      )}
      {/* 10枚目のヒントのように見せるラベル。HintCard.tsxのラベルと同じ書式・内側余白に揃える。
          expanded後もDOMからは外さず不透明度だけ落とす。unmountすると枠が広がる
          演出と足並みが揃わず、ラベルだけ先に消えて見えるため */}
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
