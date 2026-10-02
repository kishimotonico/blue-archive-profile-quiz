import {
  getQuestionOutcome,
  getRoundView,
  type QuestionOutcome,
  type RoundState,
} from "../../quiz-core";
import HaloRingGauge from "../common/HaloRingGauge";

const OUTCOME_LABEL: Record<QuestionOutcome, { text: string; className: string }> = {
  correct: { text: "正解！", className: "text-ba-correct" },
  wrong: { text: "不正解…", className: "text-ba-wrong" },
  gaveUp: { text: "ギブアップ", className: "text-ba-ink-soft" },
};

interface RoundResultSummaryProps {
  round: RoundState;
}

// 回答後の面は回答前から mount されているため、playing 中は score=0 のリングと空の文言で描画しておく。
// answered になった瞬間にリングが .ba-ring-fill の transition で伸びる
function RoundResultSummary({ round }: RoundResultSummaryProps) {
  const { student, score } = getRoundView(round);
  const outcome = round.status === "answered" ? getQuestionOutcome(round.result) : null;
  const label = outcome && OUTCOME_LABEL[outcome];

  return (
    <div className="flex min-w-0 items-center gap-3">
      <HaloRingGauge
        value={score / 10}
        size={52}
        strokeWidth={5}
        trackColor="var(--color-ba-border)"
        fillFrom="var(--color-ba-yellow)"
        fillTo="var(--color-ba-blue)"
      >
        {/* 「点」を数字の横に並べると、2桁の10点でリングの内側に収まらない */}
        <span className="font-display text-lg font-black leading-none text-ba-navy tabular-nums">
          {score}
        </span>
        <span className="text-[9px] font-bold leading-none text-ba-ink-soft">点</span>
      </HaloRingGauge>
      <div className="flex min-w-0 flex-col">
        <span
          className={`truncate font-display text-xl font-black leading-7 ${label?.className ?? ""}`}
        >
          {label?.text}
        </span>
        <span className="truncate text-sm leading-5 text-ba-navy">
          {outcome && outcome !== "correct" && <span className="text-ba-ink-soft">正解は </span>}
          {outcome && <span className="font-bold">{student.fullName}</span>}
        </span>
      </div>
    </div>
  );
}

export default RoundResultSummary;
