import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { flushSync } from "react-dom";
import { getNextStep, getPortraitState, getVisibleHintCount, type Student } from "../../quiz-core";
import Button from "../common/Button";
import HintList from "./HintList";
import MobilePortraitCard from "./MobilePortraitCard";
import QuizPlayArea from "./QuizPlayArea";
import QuizTitleRow from "./QuizTitleRow";
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

// 回答前の操作エリア（開示ボタン1段＋入力欄1段）と高さを揃えるため、結果表示を
// ボタンと同じ箱（border-2・py-3・text-base）1段に収め、主ボタンと合わせて2段にしている。
// 生徒名は長さが一定でないため truncate で1行に収める
function RevealedFace({
  student,
  correct,
  score,
  afterAnswer,
  primaryButtonRef,
}: RevealedFaceProps) {
  return (
    <div className="min-w-0 flex flex-col items-stretch gap-3 py-3">
      {afterAnswer.notice}
      <div className="flex min-w-0 items-center justify-center gap-2 rounded-lg border-2 border-transparent px-4 py-3 text-base">
        <span
          className={`shrink-0 font-display font-black ${correct ? "text-ba-correct" : "text-ba-wrong"}`}
        >
          {correct ? "正解！" : "不正解..."}
        </span>
        <span className="shrink-0 inline-flex items-baseline gap-1 rounded-full border border-ba-yellow-soft bg-linear-to-b from-ba-yellow-soft/40 to-ba-yellow/60 px-2.5 py-0.5 text-ba-navy">
          <span className="text-sm font-bold">{score}</span>
          <span className="text-[10px] font-bold">点</span>
        </span>
        <span className="min-w-0 flex-1 truncate text-left font-display font-black text-ba-navy">
          {student.fullName}
        </span>
      </div>
      <Button
        ref={primaryButtonRef}
        variant="accent"
        className="w-full"
        onClick={afterAnswer.primaryAction.onClick}
      >
        {afterAnswer.primaryAction.label}
      </Button>
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
  // 非表示側（answered/playingの反対）に複製するボタンに使う。実際のフォーカス対象
  // （hintButtonRef/primaryButtonRef）と同じrefを使うと、後から描画される
  // 複製側にrefが上書きされてフォーカス制御が壊れるため分けている
  const dummyHintButtonRef = useRef<HTMLButtonElement>(null);
  const dummyPrimaryButtonRef = useRef<HTMLButtonElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // preventScroll: true が無いと、ブラウザの既定のフォーカス時オートスクロールが
    // main（overflow-hidden）のscrollTopを勝手に動かし、展開時のscrollIntoViewで
    // 決めた立ち絵枠の位置をずらしてしまう
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

  // 枠が広がった瞬間（hidden→silhouette、またはhidden→revealed直行）にだけ、
  // 一度きりの位置決めをする。展開を引き起こす操作（ヒント開示の最後の一押し、回答する）
  // の中で行うことで、状態の変化を監視するeffectを持たずに済む。
  // flushSyncで操作の状態更新を同期的に確定させてから読むのは、枠のheightが
  // 展開後の最終値になったDOMを見てscrollIntoViewしたいため（変化前のDOMのままだと
  // まだ縮んだ枠を基準に位置がずれる）
  const scrollPortraitIntoView = () => {
    portraitRef.current?.scrollIntoView({ block: "end" });
  };
  const willExpandOnReveal = portraitState === "hidden" && getNextStep(round) === "silhouette";
  const handleReveal = willExpandOnReveal
    ? () => {
        flushSync(() => actions.reveal());
        scrollPortraitIntoView();
      }
    : actions.reveal;
  const willExpandOnSubmit = portraitState === "hidden";
  const handleSubmit = willExpandOnSubmit
    ? () => {
        flushSync(() => answer.onSubmit());
        scrollPortraitIntoView();
      }
    : answer.onSubmit;
  // giveUpは全ヒント開示後（silhouette表示後）にしか出せないため、枠は既に展開済みで
  // 動かさない。ラップ不要

  const makePlayArea = (ref: RefObject<HTMLButtonElement | null>) => (
    <QuizPlayArea
      variant="footer"
      hintButtonRef={ref}
      round={round}
      actions={{ reveal: handleReveal, giveUp: actions.giveUp }}
      answer={{ ...answer, onSubmit: handleSubmit }}
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

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      <QuizTitleRow modeLabel={modeLabel} heading={heading} round={round} />

      {/* scroll-smoothはscrollIntoViewのbehavior指定を省略しても効くようにするため。
          reduced motionではmotion-reduce:scroll-autoが優先され即座に位置が決まる */}
      <div className="flex-1 overflow-y-auto min-h-0 scroll-smooth motion-reduce:scroll-auto">
        {/* pb-4は立ち絵枠の下端と操作エリアの上端の間に、スクロール最下部でも
            ヒントカード間隔（gap-2=8px）より広い余白を必ず残すため */}
        <div className="flex flex-col gap-2 pb-4">
          <HintList
            hints={round.question.hints}
            visibleCount={visibleHintCount}
            animateReveal={round.status === "playing"}
            layout="mobile"
          />
          {/* hidden の間も小さな「？」枠として描画する。展開を引き起こす操作の
              クリックハンドラ（handleReveal/handleSubmit）がscrollIntoViewを呼ぶため、
              このコンポーネント自身は展開のタイミングを検知しない */}
          <MobilePortraitCard
            student={student}
            portraitState={portraitState}
            containerRef={portraitRef}
          />
        </div>
      </div>

      {/* 回答前後で操作エリアの高さを揃えてあるため（RevealedFace参照）、両方を同じ
          グリッドセルに重ねて描画するだけで答え合わせの前後で高さが変わらず、
          立ち絵枠のスクロール位置決めに寸法の見積もりが要らない */}
      <div className="shrink-0 grid" data-quiz-footer-area>
        <div
          className={`[grid-area:1/1] ${answered ? "invisible" : ""}`}
          inert={answered}
          aria-hidden={answered || undefined}
        >
          <FooterFace playArea={makePlayArea(answered ? dummyHintButtonRef : hintButtonRef)} />
        </div>
        <div
          className={`[grid-area:1/1] ${!answered ? "invisible" : ""}`}
          inert={!answered}
          aria-hidden={!answered || undefined}
        >
          {makeRevealedFace(answered ? primaryButtonRef : dummyPrimaryButtonRef)}
        </div>
      </div>
    </div>
  );
}

export default MobileQuizLayout;
