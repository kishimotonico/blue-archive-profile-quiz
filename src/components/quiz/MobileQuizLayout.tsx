import { useEffect, useRef } from "react";
import { getPortraitState, getVisibleHintCount } from "../../quiz-core";
import Button from "../common/Button";
import HintList from "./HintList";
import MobilePortraitCard from "./MobilePortraitCard";
import QuizPlayArea from "./QuizPlayArea";
import QuizTitleRow from "./QuizTitleRow";
import StudentReveal from "./StudentReveal";
import type { QuizLayoutProps } from "./quizLayoutTypes";

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

  useEffect(() => {
    if (round.status === "playing") hintButtonRef.current?.focus();
    // playing でマウントされたとき（新しい問題・再開・レイアウト切り替え）にだけフォーカスしたいため、
    // 依存配列は空にしてマウント時の1回だけに絞る
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // 回答した瞬間と、回答済みの状態でマウントされたとき（日替わりの再訪・レイアウト切り替え）の両方でフォーカスしたい
    if (round.status === "answered") primaryButtonRef.current?.focus();
  }, [round.status]);

  const { student } = round.question;
  const answered = round.status === "answered";
  const correct = answered && round.result.correct;
  const score = answered ? round.result.score : 0;
  const portraitState = getPortraitState(round);
  const visibleHintCount = getVisibleHintCount(round);

  const playArea = (
    <QuizPlayArea
      variant="footer"
      hintButtonRef={hintButtonRef}
      round={round}
      actions={actions}
      answer={answer}
    />
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      <QuizTitleRow modeLabel={modeLabel} heading={heading} round={round} />

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex flex-col gap-2">
          <HintList
            hints={round.question.hints}
            visibleCount={visibleHintCount}
            animateReveal={round.status === "playing"}
            layout="mobile"
          />
          {/* hidden の間も常にマウントしておく。カードが hidden → silhouette の遷移を見て
              フェードインとスクロールを行うため */}
          <MobilePortraitCard student={student} portraitState={portraitState} />
        </div>
      </div>

      {/* footer と回答後の面を同じグリッドセルに重ね、常に両方 mount したまま invisible/inert で
          切り替える。片方だけ mount/unmount すると、その分だけ下の面全体の高さが変わり、
          スクロール領域の残り高さが変わって（下端までスクロール済みのときにクランプが起きて）
          立ち絵の表示位置がずれるため */}
      <div className="shrink-0 grid grid-cols-1">
        {/* -mx-4 -mb-4 は main の余白を打ち消して画面端まで白い面にするため */}
        <div
          className={`col-start-1 row-start-1 min-w-0 -mx-4 -mb-4 border-t border-ba-border bg-white px-4 py-3 ${
            answered ? "invisible" : ""
          }`}
          inert={answered}
        >
          {playArea}
        </div>
        <div
          className={`col-start-1 row-start-1 min-w-0 flex flex-col items-center gap-3 py-3 ${
            answered ? "" : "invisible"
          }`}
          inert={!answered}
        >
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
      </div>
    </div>
  );
}

export default MobileQuizLayout;
