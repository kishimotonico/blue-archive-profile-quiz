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
  className?: string;
}

// hidden中の枠の高さ。デスクトップの立ち絵パネルと違い縦に積むレイアウトなので、
// 「？」だけの間はヒント一覧を圧迫しない大きさに抑える
const COMPACT_HEIGHT = "112px";
const FULL_HEIGHT = "60dvh";

// 枠の下端と操作エリアの間に必ず残す余白。MobileQuizLayout側のスクロール領域の
// pb-4（16px）に、開示中の面と回答後の面でサブピクセルの丸め方がわずかに異なる分の
// 余裕を上乗せしている
const MIN_BOTTOM_GAP = 20;

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
// 高さ測定前（answeredOperationAreaHeightがまだ0）や、操作エリアの要素が見つからない
// 場合はcenterにフォールバックする
function scrollToRestingPosition(
  el: HTMLElement,
  answeredOperationAreaHeight: number,
  behavior: ScrollBehavior,
) {
  const scrollParent = el.closest<HTMLElement>(".overflow-y-auto");
  // window.innerHeightとページの余白（main の p-4 など）から逆算すると、ページ側の
  // レイアウト定数を二重に持つことになり値がずれやすい。操作エリア自身の
  // getBoundingClientRect().bottom は画面下端に固定されている実測値なので、
  // そこから答え合わせ後の高さ分だけ引く方が正確で、ページ側の余白の値を知らずに済む
  const operationArea = document.querySelector<HTMLElement>("[data-quiz-footer-area]");
  if (answeredOperationAreaHeight <= 0 || !scrollParent || !operationArea) {
    el.scrollIntoView({ behavior, block: "center" });
    return;
  }

  const desiredBottom =
    operationArea.getBoundingClientRect().bottom - answeredOperationAreaHeight - MIN_BOTTOM_GAP;
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
