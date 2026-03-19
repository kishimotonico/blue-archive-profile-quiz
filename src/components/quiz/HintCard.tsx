import type { Hint } from "../../quiz-core";

interface HintCardProps {
  hint: Hint;
  revealed: boolean;
}

function HintCard({ hint, revealed }: HintCardProps) {
  return (
    <div
      className={`flex items-start justify-between py-2 px-3 rounded-lg border transition-all min-h-12 ${
        revealed ? "bg-white border-blue-400 shadow-xs" : "bg-gray-100 border-gray-200"
      }`}
    >
      <span className="text-xs text-gray-600 w-14 shrink-0 pt-0.5">{hint.label}</span>
      <span
        className={`text-xs font-semibold text-right flex-1 ml-1 ${revealed ? "text-gray-800" : "text-gray-400"}`}
      >
        {revealed ? hint.value : "???"}
      </span>
    </div>
  );
}

export default HintCard;
