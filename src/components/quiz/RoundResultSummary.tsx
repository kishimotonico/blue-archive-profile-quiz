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
  /** 正解した瞬間の演出（リングの波紋と判定のポップ）を出すか。完了済みの再表示では false */
  celebrate?: boolean;
}

// 回答後の面は回答前から mount されているため、playing 中は score=0 のリングと空の文言で描画しておく。
// answered になった瞬間にリングが .ba-ring-fill の transition で伸びる
function RoundResultSummary({ round, celebrate = false }: RoundResultSummaryProps) {
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
        {/* celebrate のときだけ mount し、animation を一度だけ走らせる。リングの外へ広がるが、
            祖先に overflow を切るものはない */}
        {celebrate && (
          <span
            aria-hidden="true"
            data-celebrate-ripple
            className="ba-ripple pointer-events-none absolute inset-0 rounded-full border-[3px] border-ba-sky"
          />
        )}
      </HaloRingGauge>
      <div className="flex min-w-0 flex-col">
        <span
          className={`truncate font-display text-xl font-black leading-7 ${label?.className ?? ""} ${
            celebrate ? "ba-pop" : ""
          }`}
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
