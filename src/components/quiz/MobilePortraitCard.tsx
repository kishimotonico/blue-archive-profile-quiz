import { useEffect, useRef, useState } from "react";
import type { PortraitState, Student } from "../../quiz-core";
import { getPortraitImageUrl, NO_IMAGE_URL } from "./portraitImageUrl";

interface MobilePortraitCardProps {
  student: Student;
  portraitState: PortraitState;
  /**
   * 回答後の操作エリア（正誤・得点・生徒名・主ボタン）の高さ。枠が広がりきった時点の
   * スクロール位置を決めるのに使う。回答してから位置を直すと立ち絵が動いてしまうため
   */
  answeredOperationAreaHeight: number;
  /**
   * hidden中（「？」枠）の高さ（px）。最低保証（112px）にスクロール領域の余りぶんを
   * 足した値を呼び出し側（MobileQuizLayout）が計算して渡す
   */
  compactHeight: number;
  /**
   * 展開後（silhouette/revealed）の枠の高さの上限（px）。60dvhがこれを超える場合は
   * こちらを使い、枠の上端がスクロール領域からはみ出して見切れるのを防ぐ
   */
  expandedMaxHeight: number;
  className?: string;
}

// 枠の下端と操作エリアの間に必ず残す余白。MobileQuizLayout側のスクロール領域の
// pb-4（16px）に、開示中の面と回答後の面でサブピクセルの丸め方がわずかに異なる分の
// 余裕を上乗せしている
const MIN_BOTTOM_GAP = 20;

// MobileQuizLayout.tsx の FooterFace は -mx-4 -mb-4 で QuizScreen.tsx の main の p-4 を
// 打ち消し、画面端まで白い面にしている。RevealedFace側は打ち消していないため、
// 回答後の操作エリアの下端は画面端から常にこの分だけ内側になる
const MAIN_BOTTOM_PADDING = 16;

/**
 * 展開後（silhouette/revealed）の枠の高さに使うCSSの値。60dvhとexpandedMaxHeightの
 * 小さい方をCSS側のmin()に委ね、上端がスクロール領域からはみ出さないようにする。
 * 純関数として切り出しているのは、DOM描画を介さずロジックだけを検証できるようにするため
 * （jsdomはCSSのmin()とdvh単位の組み合わせを解釈できない）
 */
export function expandedHeightStyle(expandedMaxHeight: number): string {
  return `min(60dvh, ${expandedMaxHeight}px)`;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// 枠が広がりきった時点で、「回答後の操作エリアの高さ」を織り込んだ位置へ一度だけ
// スクロールする。回答した瞬間に位置を直すと立ち絵が動いてしまうため、ここで先に
// 決めてしまい、以後（silhouette→revealedやhidden→revealed直行を含め）は
// スクロールし直さない。
// 高さ測定前（answeredOperationAreaHeightがまだ0）や、スクロール領域の祖先が見つからない
// 場合はcenterにフォールバックする
function scrollToRestingPosition(
  el: HTMLElement,
  answeredOperationAreaHeight: number,
  behavior: ScrollBehavior,
) {
  const scrollParent = el.closest<HTMLElement>(".overflow-y-auto");
  if (answeredOperationAreaHeight <= 0 || !scrollParent) {
    el.scrollIntoView({ behavior, block: "center" });
    return;
  }

  // 操作エリア（[data-quiz-footer-area]）の実測 getBoundingClientRect().bottom は
  // このタイミング（回答前）では未回答時の面（footer）を指しており、footerは
  // MobileQuizLayout.tsx側の-mb-4でmainのp-4を打ち消して画面端まで伸びている。
  // 一方answeredOperationAreaHeightは回答後の面（revealed、打ち消しなし）の高さなので、
  // 実測のoperationArea.bottomをそのまま使うと、回答後に実際に置かれる位置よりMAIN_BOTTOM_PADDING
  // 分だけ下だと見積もってしまい、枠を上へ押し上げすぎて上端が見切れることがあった。
  // window.innerHeightはmain（h-[100dvh]の中でflex-1）の下端と一致するため、
  // そこからmainのp-4ぶんを引けば、回答後の面がどちらであっても変わらない基準になる
  const desiredBottom =
    window.innerHeight - MAIN_BOTTOM_PADDING - answeredOperationAreaHeight - MIN_BOTTOM_GAP;
  const delta = el.getBoundingClientRect().bottom - desiredBottom;
  if (delta !== 0 && typeof scrollParent.scrollBy === "function") {
    scrollParent.scrollBy({ top: delta, behavior });
  }
}

// モバイルではヒント一覧の下に立ち絵を表示する。デスクトップの立ち絵パネルとは
// 切り抜き・スクロール挙動が異なるため、StudentPortrait とは別コンポーネントにしている
function MobilePortraitCard({
  student,
  portraitState,
  answeredOperationAreaHeight,
  compactHeight,
  expandedMaxHeight,
  className = "",
}: MobilePortraitCardProps) {
  const portraitRef = useRef<HTMLDivElement>(null);
  const prevPortraitState = useRef(portraitState);
  const expanded = portraitState !== "hidden";
  const prevExpanded = useRef(expanded);
  // scrollToRestingPositionを呼ぶ時点（transitionend発火時やreduced motionの即時実行時）
  // での最新値を使うため、レンダーのたびに更新するrefに保持する。エフェクトの依存配列に
  // 含めて張り直すと、ResizeObserverの測定更新のたびにtransitionendの購読が切り替わり、
  // 発火を取りこぼしかねないため、値の受け渡しだけrefに任せている
  const answeredOperationAreaHeightRef = useRef(answeredOperationAreaHeight);
  answeredOperationAreaHeightRef.current = answeredOperationAreaHeight;
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
      // silhouette→revealedでは枠自体の高さは変わらず、位置は下のexpandエフェクトが
      // 広がりきった時点で既に「回答後の高さ」を織り込んで決めているため、ここでは
      // 何もしない（回答直後に位置を直すと立ち絵が動く不具合の元だった）
    } else if (portraitState === "hidden") {
      setShowSilhouette(false);
    }
    prevPortraitState.current = portraitState;
  }, [portraitState]);

  // スクロールは枠が hidden→silhouette/revealed で広がるときだけ行う。この一度きりの
  // タイミングで、答え合わせ後に操作エリアが自然な高さへ変わることまで見込んだ位置に
  // 決めてしまうことで、実際に答え合わせが起きてもスクロール位置は変えずに済む。
  // 広がりきる前にスクロールすると、まだ縮んだ枠を基準に位置がずれるため、高さの
  // transitionend を待ってから位置を決める。reduced motion では transition 自体が無く
  // transitionend も飛ばないため、即座に決める
  useEffect(() => {
    const wasExpanded = prevExpanded.current;
    prevExpanded.current = expanded;
    if (wasExpanded || !expanded) return;

    const el = portraitRef.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      scrollToRestingPosition(el, answeredOperationAreaHeightRef.current, "auto");
      return;
    }

    const handleTransitionEnd = (e: TransitionEvent) => {
      if (e.propertyName !== "height" || e.target !== el) return;
      scrollToRestingPosition(el, answeredOperationAreaHeightRef.current, "smooth");
    };
    el.addEventListener("transitionend", handleTransitionEnd);
    return () => el.removeEventListener("transitionend", handleTransitionEnd);
  }, [expanded]);

  return (
    <div
      ref={portraitRef}
      data-portrait
      style={{ height: expanded ? expandedHeightStyle(expandedMaxHeight) : `${compactHeight}px` }}
      className={`relative w-full overflow-hidden rounded-2xl border transition-[height,background-color,border-color] duration-500 motion-reduce:transition-none ${
        expanded ? "border-ba-border bg-white" : "border-transparent bg-ba-sky-1/60"
      } ${className}`}
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
        // 縮んだ状態はヒント一覧の10枚目の未開示カードに見せたいため、
        // HintCard の未開示面（bg-ba-sky-1/60・枠なし）と同じ地の上に「？」だけを中央に置く
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-light text-ba-blue/40">?</span>
        </div>
      )}
      {/* 10枚目のヒントのように見せるラベル。HintCard.tsxのラベルと同じ書式・内側余白に揃える。
          expanded後もDOMからは外さず不透明度だけ落とす。unmountすると枠が広がる
          トランジションと足並みが揃わず、ラベルだけ先に消えて見えるため */}
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
