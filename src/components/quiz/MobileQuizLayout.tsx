import { useEffect, useRef } from "react";
import { getPortraitState, getVisibleHintCount } from "../../quiz-core";
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
  afterAnswerActions,
}: QuizLayoutProps) {
  const hintButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (round.status === "playing") hintButtonRef.current?.focus();
    // playing でマウントされたとき（新しい問題・再開・レイアウト切り替え）にだけフォーカスしたいため、
    // 依存配列は空にしてマウント時の1回だけに絞る
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { student } = round.question;
  const answered = round.status === "answered";
  const correct = answered && round.result.correct;
  const score = answered ? round.result.score : 0;
  const portraitState = getPortraitState(round);
  const visibleHintCount = getVisibleHintCount(round);

  const afterAnswerActionsWrapperClass = "mt-1 w-full max-w-xs";

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

      {answered && (
        <div className="py-3 flex flex-col items-center gap-3">
          <StudentReveal student={student} correct={correct} score={score} />
          {afterAnswerActions && (
            <div className={afterAnswerActionsWrapperClass}>{afterAnswerActions}</div>
          )}
        </div>
      )}

      {/* 回答後は playArea が無くなるため、枠（背景・ボーダー）ごと消す。
          -mx-4 -mb-4 は main の余白を打ち消して画面端まで白い面にするため */}
      {!answered && (
        <div className="-mx-4 -mb-4 shrink-0 border-t border-ba-border bg-white px-4 py-3">
          {playArea}
        </div>
      )}
    </div>
  );
}

export default MobileQuizLayout;
