import { getMaxScore } from "../../quiz-core";

interface ScoreDisplayProps {
  score: number;
  showMax?: boolean;
}

function ScoreDisplay({ score, showMax = true }: ScoreDisplayProps) {
  const maxScore = getMaxScore();

  return (
    <div className="bg-white rounded-lg shadow-md p-4 text-center">
      <div className="text-sm text-gray-600 mb-1">スコア</div>
      <div className="text-3xl font-bold text-blue-600">
        {score}
        {showMax && <span className="text-gray-400"> / {maxScore}</span>}
      </div>
    </div>
  );
}

export default ScoreDisplay;
