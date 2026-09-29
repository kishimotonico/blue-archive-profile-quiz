import { describe, it, expect } from "vitest";
import { summarizeRecords, summarizeResults } from "./stats";
import type { QuestionRecord, QuestionResult } from "./types";

function makeRecord(score: number): QuestionRecord {
  return {
    key: { version: 2, baseDate: "2026-04-21", seed: 20260421 },
    result: { studentId: "shiroko", usedHintCount: 1, correct: score > 0, userAnswer: null, score },
    playedAt: 1776800000000,
  };
}

describe("summarizeRecords", () => {
  it("記録が無ければ全て0", () => {
    expect(summarizeRecords([])).toEqual({
      totalAttempts: 0,
      bestScore: 0,
      rankCounts: { SS: 0, S: 0, A: 0, B: 0, C: 0, D: 0 },
    });
  });

  it("各ランクの件数・ベストスコア・累計回数を集計する", () => {
    const records = [10, 9, 8, 7, 6, 5, 4, 3, 1, 0].map(makeRecord);
    expect(summarizeRecords(records)).toEqual({
      totalAttempts: 10,
      bestScore: 10,
      rankCounts: { SS: 1, S: 2, A: 2, B: 2, C: 2, D: 1 },
    });
  });
});

function makeResult(score: number, correct: boolean): QuestionResult {
  return { studentId: "shiroko", usedHintCount: 1, correct, userAnswer: correct ? "shiroko" : null, score };
}

describe("summarizeResults", () => {
  it("結果が無ければ全て0", () => {
    expect(summarizeResults([])).toEqual({ totalScore: 0, correctCount: 0, maxScore: 0 });
  });

  it("得点の合計・正解数・最大スコア（10点 × 問題数）を集計する", () => {
    const results = [makeResult(10, true), makeResult(0, false), makeResult(3, true)];
    expect(summarizeResults(results)).toEqual({ totalScore: 13, correctCount: 2, maxScore: 30 });
  });
});
