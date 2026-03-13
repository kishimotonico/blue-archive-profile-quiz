import { useLocation, Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Button from "../components/common/Button";
import { getMaxScore, getScoreRank } from "../quiz-core";

interface ResultState {
  totalScore: number;
  scores: number[];
  totalQuestions: number;
}

function Result() {
  const location = useLocation();
  const state = location.state as ResultState | null;

  if (!state) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-8">結果</h1>
            <p className="text-gray-600 mb-8">結果データがありません</p>
            <Link to="/">
              <Button variant="primary">ホームに戻る</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { totalScore, scores, totalQuestions } = state;
  const maxPossibleScore = getMaxScore() * totalQuestions;
  const averageScore = totalScore / totalQuestions;
  const correctCount = scores.filter((s) => s > 0).length;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">クイズ結果</h1>

          {/* 合計スコア */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-blue-600 mb-4">{totalScore}</div>
              <div className="text-xl text-gray-600 mb-2">/ {maxPossibleScore} 点</div>
              <div className="text-sm text-gray-500">
                正解率: {((correctCount / totalQuestions) * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* 統計情報 */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">統計</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">正解数</div>
                <div className="text-2xl font-bold text-green-600">
                  {correctCount} / {totalQuestions}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">平均スコア</div>
                <div className="text-2xl font-bold text-blue-600">{averageScore.toFixed(1)}</div>
              </div>
            </div>
          </div>

          {/* 問題ごとのスコア */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">問題ごとのスコア</h2>
            <div className="grid grid-cols-5 gap-2">
              {scores.map((score, index) => (
                <div
                  key={index}
                  className={`p-3 rounded text-center ${
                    score > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  <div className="text-xs text-gray-600">Q{index + 1}</div>
                  <div className="text-lg font-bold">{getScoreRank(score)}</div>
                  <div className="text-xs">{score}点</div>
                </div>
              ))}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="space-y-3">
            <Link to="/regular" className="block">
              <Button variant="primary" className="w-full">
                もう一度プレイ
              </Button>
            </Link>
            <Link to="/" className="block">
              <Button variant="secondary" className="w-full">
                ホームに戻る
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Result;
