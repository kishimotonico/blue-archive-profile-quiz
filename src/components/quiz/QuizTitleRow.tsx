import type { ReactNode } from "react";
import { getRemainingStages, getTotalStages, type RoundState } from "../../quiz-core";
import HaloRingGauge from "../common/HaloRingGauge";

interface QuizTitleRowProps {
  modeLabel: string;
  heading: ReactNode;
  round: RoundState;
  /** 回答後にリングの位置へ重ねて出す補足 */
  status?: ReactNode;
  /** 余白はレイアウトごとに違うため呼び出し側が持つ */
  className: string;
}

function QuizTitleRow({ modeLabel, heading, round, status, className }: QuizTitleRowProps) {
  const answered = round.status === "answered";
  const totalStages = getTotalStages(round);
  const remainingStages = getRemainingStages(round);

  return (
    <div className={`shrink-0 flex items-center justify-between gap-3 ${className}`}>
      <div className="min-w-0 flex flex-col gap-0.5">
        <span className="text-xs font-bold text-ba-ink-soft truncate">{modeLabel}</span>
        <h1 className="font-display text-xl font-black leading-tight text-ba-navy truncate">
          {heading}
        </h1>
      </div>
      {/* 回答後もタイトル行の高さが変わらないよう、リングは消さず invisible で隠し、
          同じグリッドセルに status を重ねる */}
      <div className="grid shrink-0 justify-items-end">
        <HaloRingGauge
          value={remainingStages / totalStages}
          size={52}
          label={answered ? undefined : `残りヒント ${remainingStages}`}
          className={`col-start-1 row-start-1 ${answered ? "invisible" : ""}`}
        >
          <span className="font-display text-base font-black text-ba-blue">{remainingStages}</span>
        </HaloRingGauge>
        {answered && status && <div className="col-start-1 row-start-1 self-center">{status}</div>}
      </div>
    </div>
  );
}

export default QuizTitleRow;
