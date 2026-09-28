import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { getPortraitState, getVisibleHintCount, type Student } from "../../quiz-core";
import Button from "../common/Button";
import HintList from "./HintList";
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

// lg（1024px）未満。立ち絵はヒント一覧の下に表示し、回答欄は画面下部に固定する
function MobileQuizLayout({
  modeLabel,
  heading,
  round,
  actions,
  answer,
  afterAnswer,
}: QuizLayoutProps) {
  const hintButtonRef = useRef<HTMLButtonElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  // 高さ測定用に非表示で複製する面のボタンに使う。実際のフォーカス対象
  // （hintButtonRef/primaryButtonRef）と同じrefを使うと、後から描画される
  // 複製側にrefが上書きされてフォーカス制御が壊れるため分けている
  const dummyHintButtonRef = useRef<HTMLButtonElement>(null);
  const dummyPrimaryButtonRef = useRef<HTMLButtonElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const revealedRef = useRef<HTMLDivElement>(null);
  // 表示していない面の高さ。表示面は自然な高さを取り、この差分をスクロール領域側の
  // 余白として確保することで、操作エリアの高さが変わってもスクロール領域の
  // scrollHeight+clientHeightの合計が一定に保たれ、scrollTopのクランプによる
  // 立ち絵の位置ずれを避けられる
  const [footerHeight, setFooterHeight] = useState(0);
  const [revealedHeight, setRevealedHeight] = useState(0);

  useEffect(() => {
    if (typeof ResizeObserver !== "function") return;
    const footerEl = footerRef.current;
    const revealedEl = revealedRef.current;
    if (!footerEl || !revealedEl) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
        if (entry.target === footerEl) setFooterHeight(height);
        else if (entry.target === revealedEl) setRevealedHeight(height);
      }
    });
    observer.observe(footerEl);
    observer.observe(revealedEl);
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

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      <QuizTitleRow modeLabel={modeLabel} heading={heading} round={round} />

      <div className="flex-1 overflow-y-auto min-h-0">
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
          />
          {spacerHeight > 0 && (
            <div style={{ height: spacerHeight }} aria-hidden="true" data-portrait-spacer />
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
