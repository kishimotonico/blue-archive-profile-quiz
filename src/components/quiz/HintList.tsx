import type { Hint } from '../../quiz-core';
import HintCard from './HintCard';

interface HintListProps {
  hints: Hint[];
  revealedCount: number;
}

function HintList({ hints, revealedCount }: HintListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
