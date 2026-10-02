import { SCORE_RANKS, type ScoreRank } from "../../quiz-core";

interface RankDistributionProps {
  counts: Record<ScoreRank, number>;
  /** 今日のランク。その行の棒だけ強調する */
  highlightRank: ScoreRank | null;
}

function RankDistribution({ counts, highlightRank }: RankDistributionProps) {
  const maxCount = Math.max(...SCORE_RANKS.map(({ rank }) => counts[rank]));

  return (
    <ul aria-label="ランク分布" className="flex flex-col gap-1.5">
      {SCORE_RANKS.map(({ rank, min, max }) => {
        const count = counts[rank];
        const isToday = rank === highlightRank;
        const range = min === max ? `${min}点` : `${min}-${max}点`;
        const ratio = maxCount === 0 ? 0 : count / maxCount;

        return (
          <li key={rank} className="flex items-center">
            <span className="sr-only">
              {`${rank}ランク ${range} ${count}回${isToday ? "（今日）" : ""}`}
            </span>
            <span aria-hidden="true" className="flex w-16 shrink-0 items-baseline gap-1">
              <span className="font-display font-black text-ba-navy">{rank}</span>
              <span className="text-[10px] text-ba-ink-soft">{range}</span>
            </span>
            <span aria-hidden="true" className="flex min-w-0 flex-1 items-center">
              {/* 2rem は右隣の数字の分。inline style の width は @starting-style で上書きできないため、伸びる動きは scale-x で作る */}
              <span
                className={`block h-5 origin-left rounded-r transition-transform duration-500 starting:scale-x-0 motion-reduce:transition-none ${
                  isToday ? "bg-ba-blue" : "bg-ba-sky-2"
                }`}
                style={{ width: `max(4px, calc((100% - 2rem) * ${ratio}))` }}
              />
              <span className="ml-1.5 text-sm font-bold tabular-nums text-ba-navy">{count}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default RankDistribution;
