import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import Button from "../components/common/Button";
import { getScoreRank, getQuestionOutcome, summarizeResults } from "../quiz-core";
import type { QuestionResult, QuestionOutcome } from "../quiz-core";
import { allStudentsAtom } from "../store/students";

interface ResultState {
  results: QuestionResult[];
}

function outcomeLabel(outcome: QuestionOutcome): string {
  if (outcome === "correct") return "正解";
  if (outcome === "wrong") return "誤答";
  return "パス";
}

function outcomeClass(outcome: QuestionOutcome): string {
  if (outcome === "correct") return "bg-ba-correct-soft text-ba-correct";
  if (outcome === "wrong") return "bg-ba-wrong-soft text-ba-wrong";
  return "bg-ba-bg text-ba-ink-soft";
}

function hintCountLabel(count: number): string {
  return `${count}/10`;
}

function ResultContent({ results }: { results: QuestionResult[] }) {
  const allStudents = useAtomValue(allStudentsAtom);
  const navigate = useNavigate();

  const studentMap = useMemo(() => {
    const map = new Map(allStudents.map((s) => [s.id, s]));
    return map;
  }, [allStudents]);

  const totalQuestions = results.length;
  const { totalScore, correctCount, maxScore: maxPossibleScore } = summarizeResults(results);

  return (
    <div className="min-h-[calc(100dvh-var(--header-height))]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-2xl font-black text-ba-navy mb-6">クイズ結果</h1>

          <div className="bg-white border border-ba-border rounded-2xl p-8 mb-6">
            <div className="text-center">
              <div className="font-display text-6xl font-black text-ba-blue mb-4">{totalScore}</div>
              <div className="text-xl text-ba-ink-soft mb-2">/ {maxPossibleScore} 点</div>
              <div className="text-sm text-ba-ink-soft">
                {correctCount} / {totalQuestions} 問正解
              </div>
            </div>
          </div>

          <div className="bg-white border border-ba-border rounded-2xl p-6 mb-6">
            <h2 className="font-display text-lg font-black text-ba-navy mb-4">問題ごとのスコア</h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {results.map((r, index) => {
                const outcome = getQuestionOutcome(r);
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-center ${outcomeClass(outcome)}`}
                  >
                    <div className="text-xs">Q{index + 1}</div>
                    <div className="font-bold text-lg tabular-nums">
                      {r.score}
                      <span className="text-xs font-normal">点</span>
                    </div>
                    <div className="text-xs opacity-80">{getScoreRank(r.score)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-ba-border rounded-2xl p-6 mb-6">
            <h2 className="font-display text-lg font-black text-ba-navy mb-4">詳細</h2>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-ba-border text-ba-ink-soft">
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
                      <tr key={index} className="border-b border-ba-border/60 last:border-0">
                        <td className="py-3 pr-4 text-ba-ink-soft">{index + 1}</td>
                        <td className="py-3 pr-4">
                          <div className="font-medium text-ba-navy">
                            {student?.fullName ?? r.studentId}
                          </div>
                          <div className="text-xs text-ba-ink-soft">{student?.school}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${outcomeClass(outcome)}`}
                          >
                            {outcomeLabel(outcome)}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-ba-ink-soft">
                          {hintCountLabel(r.usedHintCount)}
                        </td>
                        <td className="py-3 pr-4 text-ba-ink-soft">{r.userAnswer ?? "—"}</td>
                        <td className="py-3">
                          <span className="font-bold text-ba-navy tabular-nums">{r.score}点</span>
                          <span className="ml-1 text-xs text-ba-ink-soft">
                            {getScoreRank(r.score)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {results.map((r, index) => {
                const outcome = getQuestionOutcome(r);
                const student = studentMap.get(r.studentId);
                return (
                  <div key={index} className="border border-ba-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-ba-ink-soft">Q{index + 1}</span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${outcomeClass(outcome)}`}
                      >
                        {outcomeLabel(outcome)}
                      </span>
                    </div>
                    <div className="font-medium text-sm mb-2 text-ba-navy">
                      {student?.fullName ?? r.studentId}
                    </div>
                    <div className="text-xs text-ba-ink-soft mb-2">{student?.school}</div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <dt className="text-ba-ink-soft">開示ヒント</dt>
                      <dd className="text-ba-navy">{hintCountLabel(r.usedHintCount)}</dd>
                      <dt className="text-ba-ink-soft">あなたの回答</dt>
                      <dd className="text-ba-navy">{r.userAnswer ?? "—"}</dd>
                      <dt className="text-ba-ink-soft">得点</dt>
                      <dd className="text-ba-navy">
                        <span className="font-bold tabular-nums">{r.score}点</span>{" "}
                        <span className="text-ba-ink-soft">{getScoreRank(r.score)}</span>
                      </dd>
                    </dl>
                  </div>
                );
              })}
            </div>
          </div>

          {/* a > button の入れ子を避けるため、Link ではなく navigate で遷移する */}
          <div className="space-y-3">
            <Button variant="accent" className="w-full" onClick={() => navigate("/regular")}>
              もう一度プレイ
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => navigate("/")}>
              ホームに戻る
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultState | null;

  if (!state || !state.results) {
    return (
      <div className="min-h-[calc(100dvh-var(--header-height))]">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="font-display text-2xl font-black text-ba-navy mb-8">結果</h1>
            <p className="text-ba-ink-soft mb-8">結果データがありません</p>
            <Button variant="primary" onClick={() => navigate("/")}>
              ホームに戻る
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <ResultContent results={state.results} />;
}

export default Result;
