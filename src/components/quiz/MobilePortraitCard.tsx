import type { RefObject } from "react";
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

// Tailwindの任意値は文字列をそのまま静的解析するため、クラス名はテンプレートで
// 組み立てずリテラルで書く必要がある。展開後の高さ上限はcqh（MobileQuizLayout参照）と
// 60dvhの小さい方を使い、低い端末で上端が見切れないようにする

// モバイルではヒント一覧の下に立ち絵を表示する。デスクトップの立ち絵パネルとは
// 切り抜き・スクロール挙動が異なるため、StudentPortrait とは別コンポーネントにしている
function MobilePortraitCard({
  student,
  portraitState,
  containerRef,
  className = "",
}: MobilePortraitCardProps) {
  const expanded = portraitState !== "hidden";

  return (
    <div
      ref={containerRef}
      data-portrait
      className={[
        "relative w-full overflow-hidden rounded-2xl border duration-500 ease-out motion-reduce:transition-none",
        // 枠の下端と操作エリアの間に残す隙間。回答前後で操作エリアの高さを揃えたため固定値で表せる
        "[scroll-margin-bottom:1rem]",
        // 高さは即座に切り替え、見た目は clip-path の遷移で広げる。height を遷移させると img が毎フレーム再レイアウトされる
        "[--portrait-compact-height:max(7rem,25dvh)]",
        "starting:[clip-path:inset(0_0_calc(100%_-_var(--portrait-compact-height))_0_round_1rem)]",
        // cqh は MobileQuizLayout のスクロール領域基準。60dvh との小さい方にして低い端末でも上端が見切れないようにする。
        // hidden 中は clip-path を遷移させない。dvh が変わると切り込みの値も変わり、下端が欠けて見えるため
        expanded
          ? "h-[min(60dvh,calc(100cqh_-_2rem))] [clip-path:inset(0_round_1rem)] transition-[background-color,border-color,clip-path] border-ba-border bg-white"
          : "h-[max(7rem,25dvh)] [clip-path:inset(0_0_calc(100%_-_var(--portrait-compact-height))_0_round_1rem)] transition-[background-color,border-color] border-transparent bg-ba-sky-1/60",
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
        // 縮んだ状態はヒント一覧の10枚目の未開示カードに見せたいため、
        // HintCard の未開示面（bg-ba-sky-1/60・枠なし）と同じ地の上に「？」だけを中央に置く
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-light text-ba-blue/40">?</span>
        </div>
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
