// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import QuizPlayArea from "./QuizPlayArea";
import type { Hint, QuizQuestion, RoundState, Student } from "../../quiz-core";
import type { AnswerDraft } from "./quizLayoutTypes";

const makeStudent = (): Student => ({
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
});

const makeHints = (count: number): Hint[] =>
  Array.from({ length: count }, (_, i) => ({
    type: "school",
    label: `ヒント${i + 1}`,
    value: `値${i + 1}`,
  }));

const makeQuestion = (): QuizQuestion => ({
  student: makeStudent(),
  hints: makeHints(3),
  key: { version: 2, baseDate: "2026-04-21", seed: 1 },
});

const playingRound = (revealedHintCount: number): RoundState => ({
  status: "playing",
  question: makeQuestion(),
  revealedHintCount,
});

const noopAnswer: AnswerDraft = {
  value: "",
  onChange: vi.fn(),
  onSubmit: vi.fn().mockReturnValue("accepted"),
  error: null,
  dismissError: vi.fn(),
};

function renderPlayArea(round: RoundState) {
  return render(
    <QuizPlayArea
      round={round}
      actions={{ reveal: vi.fn(), giveUp: vi.fn() }}
      answer={noopAnswer}
    />,
  );
}

describe("QuizPlayArea - 開示ボタンの出し分け", () => {
  it("開示数がヒント数未満なら「次のヒントを開示」", () => {
    renderPlayArea(playingRound(1));
    expect(screen.getByRole("button", { name: "次のヒントを開示" })).toBeTruthy();
  });

  it("開示数がヒント数と同じなら「シルエットを表示」", () => {
    renderPlayArea(playingRound(3));
    expect(screen.getByRole("button", { name: "シルエットを表示" })).toBeTruthy();
  });

  it("開示数がヒント数を超えたら「諦めて正解を表示」", () => {
    renderPlayArea(playingRound(4));
    expect(screen.getByRole("button", { name: "諦めて正解を表示" })).toBeTruthy();
  });
});

describe("QuizPlayArea - autoFocusHintButton", () => {
  it("シルエット表示済み（giveUp段階）のplayingを初期状態にしても「諦めて正解を表示」にフォーカスする", () => {
    render(
      <QuizPlayArea
        round={playingRound(4)}
        autoFocusHintButton
        actions={{ reveal: vi.fn(), giveUp: vi.fn() }}
        answer={noopAnswer}
      />,
    );
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "諦めて正解を表示" }));
  });
});
