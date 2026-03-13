import type { PortraitState } from '../../quiz-core';

export function getPortraitState(
  answered: boolean,
  revealedHintCount: number,
  hintsLength: number
): PortraitState {
  if (answered) return 'revealed';
  if (revealedHintCount > hintsLength) return 'silhouette';
  return 'hidden';
}
