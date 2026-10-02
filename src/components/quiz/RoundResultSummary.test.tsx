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

describe("RoundResultSummary - 正解の演出", () => {
  it("celebrate のときだけ波紋の要素を描画し、判定にポップのクラスを付ける", () => {
    const { container, getByText } = render(<RoundResultSummary round={round} celebrate />);

    expect(container.querySelector("[data-celebrate-ripple]")).not.toBeNull();
    expect(getByText("正解！").className).toContain("ba-pop");
  });

  it("celebrate でなければ波紋もポップもない", () => {
    const { container, getByText } = render(<RoundResultSummary round={round} />);

    expect(container.querySelector("[data-celebrate-ripple]")).toBeNull();
    expect(getByText("正解！").className).not.toContain("ba-pop");
  });
});
