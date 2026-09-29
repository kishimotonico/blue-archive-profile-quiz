import { describe, it, expect } from "vitest";
import { getQuestionOutcome } from "./result";
import type { QuestionResult } from "./types";

function makeResult(overrides: Partial<QuestionResult>): QuestionResult {
  return {
    studentId: "shiroko",
    usedHintCount: 1,
    correct: false,
    userAnswer: null,
    score: 0,
    ...overrides,
  };
}

describe("getQuestionOutcome", () => {
  it("正解なら correct", () => {
    const result = makeResult({ correct: true, userAnswer: "shiroko", score: 10 });
    expect(getQuestionOutcome(result)).toBe("correct");
  });

  it("誤答（userAnswer あり）なら wrong", () => {
    const result = makeResult({ correct: false, userAnswer: "aru" });
    expect(getQuestionOutcome(result)).toBe("wrong");
  });

  it("パス（userAnswer: null）なら gaveUp", () => {
    const result = makeResult({ correct: false, userAnswer: null });
    expect(getQuestionOutcome(result)).toBe("gaveUp");
  });

  // v3 から取り込んだ記録は userAnswer を持たない。null（パス）と区別できないため、
  // 現在は wrong 扱いになる。この挙動を変えるのは別の判断が要るので、ここでは固定する
  it("userAnswer が欠落している記録（v3取り込み相当）なら wrong", () => {
    const { userAnswer: _userAnswer, ...withoutUserAnswer } = makeResult({ correct: false });
    expect(getQuestionOutcome(withoutUserAnswer as QuestionResult)).toBe("wrong");
  });
});
