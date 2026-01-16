import type { Hint } from '../../quiz-core';

interface HintCardProps {
  hint: Hint;
  revealed: boolean;
}

function HintCard({ hint, revealed }: HintCardProps) {
  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${
        revealed
          ? 'bg-white border-blue-500'
          : 'bg-gray-200 border-gray-300'
      }`}
    >
      <div className="text-sm font-semibold text-gray-600 mb-1">
        {hint.label}
      </div>
      <div className="text-lg font-bold text-gray-800">
        {revealed ? hint.value : '???'}
      </div>
    </div>
  );
}

export default HintCard;
