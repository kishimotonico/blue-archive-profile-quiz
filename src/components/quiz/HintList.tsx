import { useRef, useEffect, useState } from 'react';
import type { Hint, Student } from '../../quiz-core';
import HintCard from './HintCard';

type PortraitState = 'hidden' | 'silhouette' | 'revealed';

interface HintListProps {
  hints: Hint[];
  revealedCount: number;
  student?: Student | null;
  portraitState?: PortraitState;
  showPortraitInGrid?: boolean;
  compactMode?: boolean;
}

function HintList({ hints, revealedCount, student, portraitState = 'hidden', showPortraitInGrid = false, compactMode = false }: HintListProps) {
  const hintRefs = useRef<(HTMLDivElement | null)[]>([]);
  const portraitRef = useRef<HTMLDivElement>(null);
  const prevRevealedCount = useRef(revealedCount);
  const prevPortraitState = useRef(portraitState);
  const [showSilhouette, setShowSilhouette] = useState(false);

  // ヒント開示時のスクロール処理
  useEffect(() => {
    if (revealedCount > prevRevealedCount.current && revealedCount <= hints.length) {
      const targetRef = hintRefs.current[revealedCount - 1];
      if (targetRef) {
        targetRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    prevRevealedCount.current = revealedCount;
  }, [revealedCount, hints.length]);

  // シルエット表示時のスクロール＋フェードイン処理
  useEffect(() => {
    if (portraitState === 'silhouette' && prevPortraitState.current === 'hidden') {
      if (portraitRef.current) {
        portraitRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setShowSilhouette(false);
      requestAnimationFrame(() => {
        setShowSilhouette(true);
      });
    } else if (portraitState === 'revealed') {
      setShowSilhouette(true);
    } else if (portraitState === 'hidden') {
      setShowSilhouette(false);
    }
    prevPortraitState.current = portraitState;
  }, [portraitState]);

  const visibleHints = compactMode
    ? hints.filter((_, index) => index < revealedCount)
    : hints;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {visibleHints.map((hint, index) => (
          <div key={index} ref={(el) => { hintRefs.current[index] = el; }}>
            <HintCard
              hint={hint}
              revealed={index < revealedCount}
            />
          </div>
        ))}
        {compactMode && revealedCount < hints.length && (
          <div className="relative overflow-hidden pointer-events-none max-h-40">
            <div className="flex flex-col gap-2">
              {hints.slice(revealedCount, revealedCount + 3).map((hint, i) => (
                <HintCard key={revealedCount + i} hint={hint} revealed={false} />
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent from-30% via-slate-50/70 via-55% to-slate-50 to-75%" />
          </div>
        )}
        {showPortraitInGrid && (
          <div ref={portraitRef} className="w-full h-[60vh] flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg border-2 border-dashed border-gray-300 relative overflow-hidden">
            <span
              className={`absolute inset-0 flex items-center justify-center text-5xl text-gray-400 font-light transition-opacity duration-500 ${
                portraitState === 'hidden' ? 'opacity-100' : 'opacity-0'
              }`}
            >
              ?
            </span>
            {student && portraitState !== 'hidden' && (
              <img
                src={`${import.meta.env.BASE_URL}data/images/portraits/${student.id}.png`}
                alt={portraitState === 'revealed' ? student.fullName : 'シルエット'}
                draggable={false}
                className={`absolute inset-0 h-full w-auto mx-auto object-contain transition-all duration-500 select-none ${
                  portraitState === 'silhouette'
                    ? showSilhouette ? 'opacity-50 brightness-0 pointer-events-none' : 'opacity-0 brightness-0 pointer-events-none'
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
