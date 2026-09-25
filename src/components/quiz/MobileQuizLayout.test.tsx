// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MobileQuizLayout from "./MobileQuizLayout";
import type { Hint, QuestionResult, QuizQuestion, RoundState, Student } from "../../quiz-core";
import type { AfterAnswer, AnswerDraft } from "./quizLayoutTypes";

// jsdomにはscrollIntoViewが無いため、回答済みマウント時の立ち絵スクロールをスタブする
Element.prototype.scrollIntoView = vi.fn();

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

const makeHints = (): Hint[] => [{ type: "school", label: "学園", value: "テスト学園" }];

const makeQuestion = (): QuizQuestion => ({
  student: makeStudent(),
  hints: makeHints(),
  key: { version: 2, baseDate: "2026-04-21", seed: 1 },
});

const question = makeQuestion();

const playingRound: RoundState = { status: "playing", question, revealedHintCount: 1 };

const answerResult: QuestionResult = {
  studentId: question.student.id,
  usedHintCount: 1,
  correct: true,
  userAnswer: question.student.name,
  score: 10,
};

const answeredRound: RoundState = { status: "answered", question, result: answerResult };

const noopAnswer: AnswerDraft = {
  value: "",
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  error: { message: null, key: 0 },
  errorVisible: false,
  dismissError: vi.fn(),
};

function renderLayout(round: RoundState, afterAnswer: AfterAnswer) {
  return render(
    <MobileQuizLayout
      modeLabel="テストモード"
      heading="見出し"
      round={round}
      actions={{ reveal: vi.fn(), giveUp: vi.fn() }}
      answer={noopAnswer}
      afterAnswer={afterAnswer}
    />,
  );
}

describe("MobileQuizLayout - 回答後の主ボタンへのフォーカス", () => {
  it("回答済みの状態でマウントされると主ボタンにフォーカスがある", () => {
    renderLayout(answeredRound, { primaryAction: { label: "次の問題へ", onClick: vi.fn() } });

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "次の問題へ" }));
  });

  it("playing から answered に変わると主ボタンにフォーカスが移る", () => {
    const { rerender } = renderLayout(playingRound, {
      primaryAction: { label: "次の問題へ", onClick: vi.fn() },
    });

    expect(screen.queryByRole("button", { name: "次の問題へ" })).toBeNull();
    rerender(
      <MobileQuizLayout
        modeLabel="テストモード"
        heading="見出し"
        round={answeredRound}
        actions={{ reveal: vi.fn(), giveUp: vi.fn() }}
        answer={noopAnswer}
        afterAnswer={{ primaryAction: { label: "次の問題へ", onClick: vi.fn() } }}
      />,
    );

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "次の問題へ" }));
  });

  it("フォーカスされた主ボタンの click で primaryAction が呼ばれる", () => {
    const onClick = vi.fn();
    renderLayout(answeredRound, { primaryAction: { label: "次の問題へ", onClick } });

    const button = screen.getByRole("button", { name: "次の問題へ" });
    expect(document.activeElement).toBe(button);
    button.click();

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
