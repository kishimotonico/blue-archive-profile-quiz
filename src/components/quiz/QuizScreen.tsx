import { type ReactNode, type RefObject } from "react";
import { useIsDesktop } from "../../hooks/useIsDesktop";
import type { Hint, Student } from "../../quiz-core";
import HaloRingGauge from "../common/HaloRingGauge";
import Header from "../layout/Header";
import HintList from "./HintList";
import QuizPlayArea from "./QuizPlayArea";
import StudentPortrait from "./StudentPortrait";
import StudentReveal from "./StudentReveal";
import { getPortraitState } from "./portraitUtils";

interface QuizScreenProps {
  /** タイトルチップに表示するモード名（例: "DAILY QUIZ" / "FREE PLAY"） */
  modeLabel: string;
  /** タイトルチップ右側の見出しテキスト */
  heading: ReactNode;
  student: Student;
  hints: Hint[];
  revealedHintCount: number;
  answered: boolean;
  correct: boolean;
  score: number;
  /** ヒントエリアのスクロールコンテナ。呼び出し側で scrollTo 等の制御に使う */
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  hintButtonRef: RefObject<HTMLButtonElement | null>;
  revealNextHint: () => void;
  submitAnswer: (answer: string) => void;
  giveUp: () => void;
  answerFeedback: string | null;
  errorKey: number;
  /**
   * モバイルの固定フッター（入力欄・ボタン類）を表示するかどうか。
   * ページによって条件が異なる（例: 日替わりは完了済み表示中も出す）ため、
   * 呼び出し側の判定をそのまま渡す。
   */
  showMobileFooter: boolean;
  /**
   * 回答前、QuizPlayArea の上に出すページ固有の要素（例: 日替わりの完了済み通知）。
   * モバイル固定フッター・デスクトップ右カラムの両方に出る。
   */
  beforeAnswerNotice?: ReactNode;
  /**
   * 回答後、結果表示の下に出すページ固有のアクション
   * （モバイルは結果表示の下、デスクトップは右カラムの結果カード内）。
   * モバイルとデスクトップでスタイルや有無が異なるため isDesktop を渡す。
   */
  renderAfterAnswerActions?: (isDesktop: boolean) => ReactNode;
}

/**
 * 日替わりクイズ・フリープレイ共通のクイズ画面レイアウト。
 * タイトル行、ヒント一覧、モバイル/デスクトップの出し分けをここに集約する。
 * 結果モーダルや初期化・進捗保存などページ固有のロジックは呼び出し側に残す。
 */
function QuizScreen({
  modeLabel,
  heading,
  student,
  hints,
  revealedHintCount,
  answered,
  correct,
  score,
  scrollContainerRef,
  hintButtonRef,
  revealNextHint,
  submitAnswer,
  giveUp,
  answerFeedback,
  errorKey,
  showMobileFooter,
  beforeAnswerNotice,
  renderAfterAnswerActions,
}: QuizScreenProps) {
  const isDesktop = useIsDesktop();
  const portraitState = getPortraitState(answered, revealedHintCount, hints.length);
  const totalStages = hints.length + 1; // 全ヒント + シルエット
  const remainingStages = Math.max(totalStages - revealedHintCount, 0);

  const playArea = (
    <QuizPlayArea
      hintButtonRef={hintButtonRef}
      revealedHintCount={revealedHintCount}
      hintsLength={hints.length}
      revealNextHint={revealNextHint}
      submitAnswer={submitAnswer}
      giveUp={giveUp}
      answerFeedback={answerFeedback}
      errorKey={errorKey}
      answered={answered}
    />
  );

  return (
    <div className="h-[100dvh] flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 pt-2 md:pt-4 max-w-6xl xl:max-w-7xl mx-auto w-full overflow-hidden">
        {/* 左ペイン: タイトル + ヒント一覧 */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* タイトル + 残りヒント数 */}
          {/* pr-16: モバイル右上固定のハンバーガーボタン（top-3 right-3, w-11 h-11）とゲージが
              重ならないよう避けるための余白。md以上ではハンバーガーが無いので不要 */}
          <div className="shrink-0 flex items-center justify-between gap-3 py-3 pr-16 md:py-1.5 md:pr-0">
            <div className="inline-flex min-w-0 items-center gap-2 rounded-2xl bg-linear-to-br from-ba-cyan to-ba-blue px-4 py-2 text-white shadow-sm md:px-3 md:py-1.5">
              <div className="ba-tag shrink-0 bg-white/25">
                <span>{modeLabel}</span>
              </div>
              <h1 className="font-display text-sm font-black leading-tight truncate sm:text-base">
                {heading}
              </h1>
            </div>
            {!answered && (
              <HaloRingGauge
                value={remainingStages / totalStages}
                size={52}
                label="残りヒント数の表示"
                className="shrink-0"
              >
                <span className="font-display text-base font-black text-ba-blue">
                  {remainingStages}
                </span>
                <span className="hidden text-[10px] text-ba-ink-soft md:block">HINT残</span>
              </HaloRingGauge>
            )}
          </div>

          {/* スクロール可能なヒントエリア（デスクトップは2列・上寄せ） */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0">
            {isDesktop ? (
              <HintList hints={hints} revealedCount={revealedHintCount} />
            ) : (
              <HintList
                hints={hints}
                revealedCount={revealedHintCount}
                student={student}
                portraitState={portraitState}
                layout="mobile"
              />
            )}
          </div>

          {/* モバイル: 回答結果表示（デスクトップは右カラムに出す） */}
          {!isDesktop && answered && (
            <div className="py-3 flex flex-col items-center gap-3">
              <StudentReveal student={student} correct={correct} score={score} />
              {renderAfterAnswerActions?.(false)}
            </div>
          )}

          {/* モバイル: 固定フッターの入力欄・ボタン類（回答後は中身が無いので枠ごと消す） */}
          {!isDesktop && showMobileFooter && (
            <div className="shrink-0 pt-3 border-t border-ba-border bg-ba-bg">
              {beforeAnswerNotice}
              {playArea}
            </div>
          )}
        </div>

        {/* 右カラム（デスクトップのみ）: 立ち絵 → 操作/結果 */}
        {isDesktop && (
          <aside className="flex w-[380px] xl:w-[420px] shrink-0 flex-col gap-3 min-h-0">
            <StudentPortrait student={student} state={portraitState} correct={correct} />
            {answered ? (
              <div className="shrink-0 rounded-2xl border border-ba-border bg-white p-3.5 shadow-xs">
                <StudentReveal student={student} correct={correct} score={score} />
                {renderAfterAnswerActions?.(true)}
              </div>
            ) : (
              <>
                {beforeAnswerNotice}
                {playArea}
              </>
            )}
          </aside>
        )}
      </main>
    </div>
  );
}

export default QuizScreen;
