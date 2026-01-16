import type { Hint } from '../../quiz-core';
import HintCard from './HintCard';

interface HintListProps {
  hints: Hint[];
  revealedCount: number;
}

function HintList({ hints, revealedCount }: HintListProps) {
  return (
    <div className="flex flex-col gap-2">
      {hints.map((hint, index) => (
        <HintCard
          key={index}
          hint={hint}
          revealed={index < revealedCount}
        />
      ))}
    </div>
  );
}

export default HintList;
