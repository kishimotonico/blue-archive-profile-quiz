import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { getPortraitState, getVisibleHintCount, type Student } from "../../quiz-core";
import { useIsHintGridTwoColumn } from "../../hooks/useHintGridTwoColumn";
import Button from "../common/Button";
import HintList from "./HintList";
import { HINT_CARD_MIN_HEIGHT_PX, HINT_GRID_GAP_PX } from "./hintDimensions";
import MobilePortraitCard from "./MobilePortraitCard";
import QuizPlayArea from "./QuizPlayArea";
import QuizTitleRow from "./QuizTitleRow";
import StudentReveal from "./StudentReveal";
import type { AfterAnswer, QuizLayoutProps } from "./quizLayoutTypes";

interface FooterFaceProps {
  playArea: ReactNode;
}

// -mx-4 -mb-4 は main の余白を打ち消して画面端まで白い面にするため
function FooterFace({ playArea }: FooterFaceProps) {
  return (
    <div className="min-w-0 -mx-4 -mb-4 border-t border-ba-border bg-white px-4 py-3">
      {playArea}
    </div>
  );
}

interface RevealedFaceProps {
  student: Student;
  correct: boolean;
  score: number;
  afterAnswer: AfterAnswer;
  primaryButtonRef: RefObject<HTMLButtonElement | null>;
}

function RevealedFace({
  student,
  correct,
  score,
  afterAnswer,
  primaryButtonRef,
}: RevealedFaceProps) {
  return (
    <div className="min-w-0 flex flex-col items-center gap-3 py-3">
      <StudentReveal student={student} correct={correct} score={score} />
      <div className="mt-1 w-full max-w-xs">
        {afterAnswer.notice}
        <Button
          ref={primaryButtonRef}
          variant="accent"
          className="w-full"
          onClick={afterAnswer.primaryAction.onClick}
        >
          {afterAnswer.primaryAction.label}
        </Button>
      </div>
    </div>
  );
}

// 「？」枠（hidden）の最低の高さ。MobilePortraitCard側の枠の見た目と揃える
const COMPACT_PORTRAIT_MIN_HEIGHT = 112;
// スクロール領域の内側コンテンツに付けているpb-4
const SCROLL_CONTENT_BOTTOM_PADDING = 16;
// 展開後の枠の下端と回答後の操作エリアの間に残す隙間。MobilePortraitCard.tsx側の
// MIN_BOTTOM_GAP（scrollToRestingPositionの目標値）と揃えている
const EXPANDED_BOTTOM_GAP = 20;
// MobilePortraitCard.tsx側のMAIN_BOTTOM_PADDINGと揃えている。scrollToRestingPositionが
// 画面下端からこのぶんを引いた位置を着地点の基準にしているため、上限の計算も
// 同じ基準（画面下端 - MAIN_BOTTOM_PADDING）から逆算する必要がある
const MAIN_BOTTOM_PADDING = 16;

/**
 * 展開後（silhouette/revealed）の枠の高さの上限（px）。60dvh固定だと、回答後の
 * 操作エリア（revealedHeight）が高い生徒では、枠の下端を操作エリアの手前に収める
 * ための逆算スクロール（MobilePortraitCard側のscrollToRestingPosition）が枠を
 * 上に押し上げすぎて、枠の上端がスクロール領域からはみ出し見切れることがある。
 * そのため、scrollToRestingPositionが実際に狙う着地点（画面下端を基準にした
 * desiredBottom）から逆算した「収まる残り」を上限として渡し、実際の採用値
 * （60dvhとの小さい方）はCSSのmin()側に委ねる。
 *
 * spaceBelowScrollAreaTopには、スクロール領域の高さ（scrollAreaHeight）ではなく
 * 「タイトル行の下端（スクロール領域の上端）から、scrollToRestingPositionが狙う
 * 着地点の基準（画面下端 - MobilePortraitCard.tsx側のMAIN_BOTTOM_PADDING）までの距離」を
 * 渡す必要がある。scrollAreaHeight単体は、答え合わせで操作エリアがfooter（未回答時の
 * 操作欄）からrevealed（回答後の面）に入れ替わるとその高さの差分だけ伸縮する
 * （flexの兄弟要素なので）。上限の計算にscrollAreaHeightをそのまま使うと、答え合わせの
 * 前後で枠の高さ自体が変わってしまい、シルエット表示後と回答後でtop/heightが一致する
 * 不変条件が崩れる。タイトル行の下端から画面下端までの距離はこの入れ替わりの影響を
 * 受けないため、代わりにこちらを基準にする。
 *
 * 純関数として切り出しているのは、DOM描画を介さずロジックだけを検証できるようにするため
 * （jsdomはCSSのmin()とdvh単位の組み合わせを解釈できず、描画結果からの検証が難しい）
 */
export function computeExpandedMaxHeight(
  spaceBelowScrollAreaTop: number,
  revealedHeight: number,
): number {
  if (spaceBelowScrollAreaTop <= 0) return Number.MAX_SAFE_INTEGER;
  return Math.max(0, spaceBelowScrollAreaTop - revealedHeight - EXPANDED_BOTTOM_GAP);
}

/**
 * 全ヒントを開示したときにHintListが実際に使う行数ぶんの高さ（px）。HintListはmd（768px）
 * 以上で2列になるため、1列固定で見積もると768〜1023px（lg未満・md以上）で実際より多い
 * 行数を見積もってしまう。
 *
 * 純関数として切り出しているのは、useIsHintGridTwoColumnが参照するwindow.matchMediaの
 * MediaQueryListがモジュール内でキャッシュされ、テストごとに値を切り替えにくいため
 * （DOM描画を介さずロジックだけを検証できるようにする）
 */
export function computeFullHintsHeight(hintCount: number, columns: number): number {
  const rows = Math.ceil(hintCount / Math.max(1, columns));
  return rows * HINT_CARD_MIN_HEIGHT_PX + Math.max(0, rows - 1) * HINT_GRID_GAP_PX;
}

// lg（1024px）未満。立ち絵はヒント一覧の下に表示し、回答欄は画面下部に固定する
function MobileQuizLayout({
  modeLabel,
  heading,
  round,
  actions,
  answer,
  afterAnswer,
}: QuizLayoutProps) {
  // md（768px）〜lg未満ではHintListが2列表示になるため、「？」枠の高さ見積もりの
  // 行数もそれに合わせる必要がある（常に1列前提だと768〜1023pxで実際より多く見積もる）
  const isHintGridTwoColumn = useIsHintGridTwoColumn();
  const hintButtonRef = useRef<HTMLButtonElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  // 高さ測定用に非表示で複製する面のボタンに使う。実際のフォーカス対象
  // （hintButtonRef/primaryButtonRef）と同じrefを使うと、後から描画される
  // 複製側にrefが上書きされてフォーカス制御が壊れるため分けている
  const dummyHintButtonRef = useRef<HTMLButtonElement>(null);
  const dummyPrimaryButtonRef = useRef<HTMLButtonElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const revealedRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  // 表示していない面の高さ。表示面は自然な高さを取り、この差分をスクロール領域側の
  // 余白として確保することで、操作エリアの高さが変わってもスクロール領域の
  // scrollHeight+clientHeightの合計が一定に保たれ、scrollTopのクランプによる
  // 立ち絵の位置ずれを避けられる
  const [footerHeight, setFooterHeight] = useState(0);
  const [revealedHeight, setRevealedHeight] = useState(0);
  // 「？」枠の高さを、端末の縦幅に応じてスクロール領域いっぱいまで伸ばすために測る
  const [scrollAreaHeight, setScrollAreaHeight] = useState(0);
  // 展開後の枠の高さの上限（computeExpandedMaxHeight）に使う、タイトル行の下端
  // （スクロール領域の上端）から画面下端までの距離。ヘッダー・タイトル行の高さで
  // 決まり、答え合わせで操作エリアの内容が入れ替わっても変わらない
  const [scrollAreaTop, setScrollAreaTop] = useState(0);

  useEffect(() => {
    if (typeof ResizeObserver !== "function") return;
    const footerEl = footerRef.current;
    const revealedEl = revealedRef.current;
    const scrollAreaEl = scrollAreaRef.current;
    if (!footerEl || !revealedEl || !scrollAreaEl) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
        if (entry.target === footerEl) setFooterHeight(height);
        else if (entry.target === revealedEl) setRevealedHeight(height);
        else if (entry.target === scrollAreaEl) {
          setScrollAreaHeight(height);
          setScrollAreaTop(entry.target.getBoundingClientRect().top);
        }
      }
    });
    observer.observe(footerEl);
    observer.observe(revealedEl);
    observer.observe(scrollAreaEl);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // preventScroll: true が無いと、ブラウザの既定のフォーカス時オートスクロールが
    // main（overflow-hidden）のscrollTopを勝手に動かし、MobilePortraitCardが
    // scrollToRestingPositionで決めた立ち絵枠の位置をずらしてしまう
    if (round.status === "playing") hintButtonRef.current?.focus({ preventScroll: true });
    // playing でマウントされたとき（新しい問題・再開・レイアウト切り替え）にだけフォーカスしたいため、
    // 依存配列は空にしてマウント時の1回だけに絞る
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // 回答した瞬間と、回答済みの状態でマウントされたとき（日替わりの再訪・レイアウト切り替え）の両方でフォーカスしたい
    if (round.status === "answered") primaryButtonRef.current?.focus({ preventScroll: true });
  }, [round.status]);

  const { student } = round.question;
  const answered = round.status === "answered";
  const correct = answered && round.result.correct;
  const score = answered ? round.result.score : 0;
  const portraitState = getPortraitState(round);
  const portraitExpanded = portraitState !== "hidden";
  const visibleHintCount = getVisibleHintCount(round);

  const makePlayArea = (ref: RefObject<HTMLButtonElement | null>) => (
    <QuizPlayArea
      variant="footer"
      hintButtonRef={ref}
      round={round}
      actions={actions}
      answer={answer}
    />
  );

  const makeRevealedFace = (ref: RefObject<HTMLButtonElement | null>) => (
    <RevealedFace
      student={student}
      correct={correct}
      score={score}
      afterAnswer={afterAnswer}
      primaryButtonRef={ref}
    />
  );

  // MobilePortraitCardは、枠が広がりきった時点（答え合わせ前）で「答え合わせ後の高さ」を
  // 見込んだスクロール位置を一度だけ決める。そのスクロール位置に実際に届くだけの余白を
  // 確保しておかないと、足りない分だけscrollTopがブラウザ側で最大値にクランプされ、
  // 立ち絵枠と操作エリアの間に確保したい隙間を割り込んでしまう。
  // この余白は答え合わせ前後どちらでも同じだけ上乗せする。片方にだけ足すと、
  // 上乗せした分だけ答え合わせの前後でスクロール領域全体の高さが変わってしまい、
  // 答え合わせした瞬間に今度はscrollTopがクランプされ直して立ち絵が動いてしまう
  const restingPositionScrollHeadroom = 64;
  const spacerHeight =
    (answered
      ? Math.max(0, footerHeight - revealedHeight)
      : Math.max(0, revealedHeight - footerHeight)) + restingPositionScrollHeadroom;

  // 枠が広がったあと（silhouette/revealed）は今まで通り、スクロール領域末尾の
  // 見えない余白として確保する。hidden（「？」枠）の間だけは、この余白を
  // 「？」枠自体の高さに繰り込んで見せる。必要なスクロール余白の量は変えず、
  // ただの空白として画面下に見えていたぶんを枠の白地に吸収させるだけなので、
  // scrollHeightに基づく位置決めの計算式（scrollToRestingPosition）には影響しない
  const layoutSpacerHeight = portraitExpanded ? spacerHeight : 0;

  // 「？」枠は最低112pxだが、スクロール領域に余りがあればそのぶんまで伸ばして
  // 画面下に空白を残さない。ヒントを開くたびに枠が縮んで見えるのを避けるため、
  // 「今開示済みのヒント数」ではなく「全ヒントを開示したときに残る分」を基準に
  // 高さを決める。全開示状態でも枠がこの高さに収まらなければ、そのぶんは
  // スクロールが発生するだけで構わない
  const hintCount = round.question.hints.length;
  const fullHintsHeight = computeFullHintsHeight(hintCount, isHintGridTwoColumn ? 2 : 1);
  const compactFillHeight = Math.max(
    COMPACT_PORTRAIT_MIN_HEIGHT,
    scrollAreaHeight - fullHintsHeight - HINT_GRID_GAP_PX - SCROLL_CONTENT_BOTTOM_PADDING,
  );
  const compactPortraitHeight = compactFillHeight + spacerHeight;
  // window.innerHeightは実機のツールバー表示/非表示で多少動くが、60dvh自体も同じ理由で
  // 変動する値なので、上限計算に使う分には同じ前提で揃っておりズレない
  const spaceBelowScrollAreaTop =
    typeof window !== "undefined" ? window.innerHeight - MAIN_BOTTOM_PADDING - scrollAreaTop : 0;
  const expandedMaxHeight = computeExpandedMaxHeight(spaceBelowScrollAreaTop, revealedHeight);

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      <QuizTitleRow modeLabel={modeLabel} heading={heading} round={round} />

      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto min-h-0">
        {/* pb-4は立ち絵枠の下端と操作エリアの上端の間に、スクロール最下部でも
            ヒントカード間隔（gap-2=8px）より広い余白を必ず残すため */}
        <div className="flex flex-col gap-2 pb-4">
          <HintList
            hints={round.question.hints}
            visibleCount={visibleHintCount}
            animateReveal={round.status === "playing"}
            layout="mobile"
          />
          {/* hidden の間も小さな「？」枠として描画する。枠が広がる遷移を自身で検知して
              スクロールするため、hidden→silhouette/revealed のどこで初めて広がるかを
              コンポーネント側に委ねている。
              answeredOperationAreaHeightにはrevealedHeight（回答後の面の高さ）を渡す。
              この面は「不正解...」表記とscore=0で常に測定され続けているため、実際に
              正解しても「正解！」に文字が変わるだけで行数・高さは変わらない。
              afterAnswer.noticeは日替わりを完了済みの状態で再訪したときだけ出る通知で、
              このコンポーネントが検知する生きた回答遷移（silhouette→revealedや
              hidden→revealed直行）の最中には出ないため、現在測定されている値を
              そのまま使えば十分（最大値を別途見積もる必要はない） */}
          <MobilePortraitCard
            student={student}
            portraitState={portraitState}
            answeredOperationAreaHeight={revealedHeight}
            compactHeight={compactPortraitHeight}
            expandedMaxHeight={expandedMaxHeight}
          />
          {layoutSpacerHeight > 0 && (
            <div style={{ height: layoutSpacerHeight }} aria-hidden="true" data-portrait-spacer />
          )}
        </div>
      </div>

      <div className="shrink-0 relative" data-quiz-footer-area>
        {/* footerRef/revealedRefは常にそれぞれ同じ面の物理的なDOM位置を指す。表示/非表示を
            JSXの分岐（＝どちらの内容がこの位置に来るか）で切り替えると、React が同じ位置の
            <div>を使い回して中身とrefだけ差し替えるため、refが指す面が答え合わせのたびに
            入れ替わってResizeObserverの計測が食い違う。それを避けるため、位置ではなく
            invisible/absoluteのCSSと inert だけで表示状態を切り替える。
            また、position:absoluteをref自身に付けると、FooterFaceの-mb-4のようなマイナス
            マージンがそのref要素で相殺されなくなり（absoluteは新しい包含ブロックを作るため
            親子間のマージン相殺が起きない）、可視/計測用で高さの測定結果がずれる。
            そのためabsolute/invisibleは1つ外側のラッパーに付け、ref自身は常に静的配置のままにする */}
        <div
          className={answered ? "invisible absolute inset-x-0 top-0" : undefined}
          inert={answered}
          aria-hidden={answered || undefined}
        >
          <div ref={footerRef}>
            <FooterFace playArea={makePlayArea(answered ? dummyHintButtonRef : hintButtonRef)} />
          </div>
        </div>
        <div
          className={!answered ? "invisible absolute inset-x-0 top-0" : undefined}
          inert={!answered}
          aria-hidden={!answered || undefined}
        >
          <div ref={revealedRef}>
            {makeRevealedFace(answered ? primaryButtonRef : dummyPrimaryButtonRef)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MobileQuizLayout;
