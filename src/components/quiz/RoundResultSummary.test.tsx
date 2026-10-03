// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import RoundResultSummary from "./RoundResultSummary";
import type { RoundState, Student } from "../../quiz-core";

const student: Student = {
  id: "s1",
  fullName: "テスト 太郎",
  name: "タロウ",
  school: "テスト学園",
  grade: "1年生",
  club: "テスト部",
  age: "15歳",
  birthday: "1月1日",
  height: "160cm",
  hobby: "テスト",
  weaponName: "テスト銃",
  cv: "テストCV",
  portraitImage: "images/s1.png",
  availableFrom: "2026-04-21",
  skills: { ex: "", normal: "", passive: "", sub: "" },
};

const round: RoundState = {
  status: "answered",
  question: { student, hints: [], key: { version: 2, baseDate: "2026-04-21", seed: 1 } },
  result: { studentId: "s1", usedHintCount: 1, correct: true, userAnswer: "タロウ", score: 10 },
};

const wrongRound: RoundState = {
  ...round,
  result: { ...round.result, correct: false, userAnswer: "ハナコ", score: 0 },
};
const gaveUpRound: RoundState = {
  ...round,
  result: { ...round.result, correct: false, userAnswer: null, score: 0 },
};

describe("RoundResultSummary - 回答した瞬間の演出", () => {
  it("今回答して正解したときだけ波紋の要素を描画し、判定にポップのクラスを付ける", () => {
    const { container, getByText } = render(<RoundResultSummary round={round} justAnswered />);

    expect(container.querySelector("[data-celebrate-ripple]")).not.toBeNull();
    expect(getByText("正解！").className).toContain("ba-pop");
  });

  it("正解では2行目を動かさない", () => {
    const { container } = render(<RoundResultSummary round={round} justAnswered />);

    expect(container.querySelector(".ba-reveal-answer")).toBeNull();
  });

  it("今回答していなければ波紋もポップもない", () => {
    const { container, getByText } = render(<RoundResultSummary round={round} />);

    expect(container.querySelector("[data-celebrate-ripple]")).toBeNull();
    expect(getByText("正解！").className).not.toContain("ba-pop");
  });

  it.each([
    ["不正解…", wrongRound],
    ["ギブアップ", gaveUpRound],
  ])("今回答した%sでは2行目だけに演出を付け、波紋とポップは出さない", (label, r) => {
    const { container, getByText } = render(<RoundResultSummary round={r} justAnswered />);

    expect(container.querySelector(".ba-reveal-answer")).not.toBeNull();
    expect(container.querySelector("[data-celebrate-ripple]")).toBeNull();
    expect(getByText(label).className).not.toContain("ba-pop");
  });

  it.each([
    ["不正解", wrongRound],
    ["ギブアップ", gaveUpRound],
  ])("今回答していない%sでは2行目に演出を付けない", (_label, r) => {
    const { container } = render(<RoundResultSummary round={r} />);

    expect(container.querySelector(".ba-reveal-answer")).toBeNull();
  });
});
