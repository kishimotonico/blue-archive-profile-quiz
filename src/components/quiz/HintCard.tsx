import type { Hint } from '../../quiz-core';

interface HintCardProps {
  hint: Hint;
  revealed: boolean;
}

function HintCard({ hint, revealed }: HintCardProps) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all ${
        revealed
          ? 'bg-white border-blue-400 shadow-sm'
          : 'bg-gray-100 border-gray-200'
      }`}
    >
      <span className="text-sm text-gray-600 w-16 shrink-0">{hint.label}</span>
      <span className={`text-sm font-semibold ${revealed ? 'text-gray-800' : 'text-gray-400'}`}>
        {revealed ? hint.value : '???'}
      </span>
    </div>
  );
}

export default HintCard;
