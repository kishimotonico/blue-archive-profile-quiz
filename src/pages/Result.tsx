import { useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAtomValue } from "jotai";
import Header from "../components/layout/Header";
import Button from "../components/common/Button";
import { getMaxScore, getScoreRank, getQuestionOutcome } from "../quiz-core";
import type { QuestionResult, QuestionOutcome } from "../quiz-core";
import { allStudentsAtom } from "../store/quiz";

interface ResultState {
  results: QuestionResult[];
}

function outcomeLabel(outcome: QuestionOutcome): string {
  if (outcome === "correct") return "正解";
  if (outcome === "wrong") return "誤答";
  return "パス";
}

function outcomeClass(outcome: QuestionOutcome): string {
  if (outcome === "correct") return "bg-green-100 text-green-800";
  if (outcome === "wrong") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-600";
}

function hintCountLabel(count: number): string {
  return `${count}/10`;
}

function ResultContent({ results }: { results: QuestionResult[] }) {
  const allStudents = useAtomValue(allStudentsAtom);

  const studentMap = useMemo(() => {
    const map = new Map(allStudents.map((s) => [s.id, s]));
    return map;
  }, [allStudents]);

  const totalQuestions = results.length;
  const totalScore = results.reduce((s, r) => s + r.score, 0);
  const correctCount = results.filter((r) => r.correct).length;
  const maxPossibleScore = getMaxScore() * totalQuestions;

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
                {correctCount} / {totalQuestions} 問正解
              </div>
            </div>
          </div>

          {/* 問題ごとのスコア（グリッド） */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">問題ごとのスコア</h2>
            <div className="grid grid-cols-5 gap-2">
              {results.map((r, index) => {
                const outcome = getQuestionOutcome(r);
                return (
                  <div
                    key={index}
                    className={`p-3 rounded text-center ${outcomeClass(outcome)}`}
                  >
                    <div className="text-xs text-gray-600">Q{index + 1}</div>
                    <div className="text-lg font-bold">{getScoreRank(r.score)}</div>
                    <div className="text-xs">{r.score}点</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 詳細テーブル */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">詳細</h2>

            {/* デスクトップ: テーブル */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="pb-2 pr-4 font-medium">#</th>
                    <th className="pb-2 pr-4 font-medium">生徒</th>
                    <th className="pb-2 pr-4 font-medium">結果</th>
                    <th className="pb-2 pr-4 font-medium">開示ヒント</th>
                    <th className="pb-2 pr-4 font-medium">あなたの回答</th>
                    <th className="pb-2 font-medium">得点</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, index) => {
                    const outcome = getQuestionOutcome(r);
                    const student = studentMap.get(r.studentId);
                    return (
                      <tr key={index} className="border-b border-gray-100 last:border-0">
                        <td className="py-3 pr-4 text-gray-400">{index + 1}</td>
                        <td className="py-3 pr-4">
                          <div className="font-medium">{student?.fullName ?? r.studentId}</div>
                          <div className="text-xs text-gray-500">{student?.school}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${outcomeClass(outcome)}`}
                          >
                            {outcomeLabel(outcome)}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-600">{hintCountLabel(r.revealedHintCount)}</td>
                        <td className="py-3 pr-4 text-gray-600">{r.userAnswer ?? "—"}</td>
                        <td className="py-3">
                          <span className="font-medium">{r.score}点</span>
                          <span className="ml-1 text-xs text-gray-400">{getScoreRank(r.score)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* モバイル: カード */}
            <div className="md:hidden space-y-3">
              {results.map((r, index) => {
                const outcome = getQuestionOutcome(r);
                const student = studentMap.get(r.studentId);
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Q{index + 1}</span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${outcomeClass(outcome)}`}
                      >
                        {outcomeLabel(outcome)}
                      </span>
                    </div>
                    <div className="font-medium text-sm mb-2">{student?.fullName ?? r.studentId}</div>
                    <div className="text-xs text-gray-500 mb-2">{student?.school}</div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <dt className="text-gray-500">開示ヒント</dt>
                      <dd className="text-gray-700">{hintCountLabel(r.revealedHintCount)}</dd>
                      <dt className="text-gray-500">あなたの回答</dt>
                      <dd className="text-gray-700">{r.userAnswer ?? "—"}</dd>
                      <dt className="text-gray-500">得点</dt>
                      <dd className="text-gray-700">
                        {r.score}点 <span className="text-gray-400">{getScoreRank(r.score)}</span>
                      </dd>
                    </dl>
                  </div>
                );
              })}
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

function Result() {
  const location = useLocation();
  const state = location.state as ResultState | null;

  if (!state || !state.results) {
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

  return <ResultContent results={state.results} />;
}

export default Result;
