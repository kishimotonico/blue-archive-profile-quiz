import type { Hint, Student } from '../../quiz-core';
import HintCard from './HintCard';

type PortraitState = 'hidden' | 'silhouette' | 'revealed';

interface HintListProps {
  hints: Hint[];
  revealedCount: number;
  student?: Student | null;
  portraitState?: PortraitState;
  showPortraitInGrid?: boolean;
}

function HintList({ hints, revealedCount, student, portraitState = 'hidden', showPortraitInGrid = false }: HintListProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {hints.map((hint, index) => (
        <HintCard
          key={index}
          hint={hint}
          revealed={index < revealedCount}
        />
      ))}
      {showPortraitInGrid && (
        <div className="col-span-2 flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg border-2 border-dashed border-gray-300 h-36 relative overflow-hidden">
          <span
            className={`absolute inset-0 flex items-center justify-center text-5xl text-gray-400 font-light transition-opacity duration-500 ${
              portraitState === 'hidden' ? 'opacity-100' : 'opacity-0'
            }`}
          >
            ?
          </span>
          {student && (
            <img
              src={`${import.meta.env.BASE_URL}data/images/portraits/${student.id}.png`}
              alt={portraitState === 'revealed' ? student.fullName : 'シルエット'}
              className={`absolute inset-0 h-full w-auto mx-auto object-contain transition-all duration-500 ${
                portraitState === 'hidden'
                  ? 'opacity-0 pointer-events-none'
                  : portraitState === 'silhouette'
                  ? 'opacity-50 brightness-0'
                  : 'opacity-100'
              }`}
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/256x256?text=No+Image';
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default HintList;
