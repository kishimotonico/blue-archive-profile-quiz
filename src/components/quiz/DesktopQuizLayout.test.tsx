// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import DesktopQuizLayout from "./DesktopQuizLayout";
import type { Hint, QuestionResult, QuizQuestion, RoundState, Student } from "../../quiz-core";
import type { AfterAnswer, AnswerDraft } from "./quizLayoutTypes";

vi.mock("./portraitImageUrl", () => ({
  getPortraitImageUrl: vi.fn().mockReturnValue("about:blank"),
  NO_IMAGE_URL: "about:blank",
}));

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
    <DesktopQuizLayout
      modeLabel="テストモード"
      heading="見出し"
      round={round}
      actions={{ reveal: vi.fn(), giveUp: vi.fn() }}
      answer={noopAnswer}
      afterAnswer={afterAnswer}
    />,
  );
}

describe("DesktopQuizLayout - 回答後の主ボタンへのフォーカス", () => {
  it("回答済みの状態でマウントされると主ボタンにフォーカスがある", () => {
    renderLayout(answeredRound, { primaryAction: { label: "結果を見る", onClick: vi.fn() } });

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "結果を見る" }));
  });

  it("playing から answered に変わると主ボタンにフォーカスが移る", () => {
    const { rerender } = renderLayout(playingRound, {
      primaryAction: { label: "結果を見る", onClick: vi.fn() },
    });

    // 立ち絵パネルの高さを answered/playing で変えないため、ボタンは playing 中も
    // mount されたまま、親セルが inert（invisible）になっている
    const primaryButtonWhilePlaying = screen.getByRole("button", { name: "結果を見る" });
    expect(primaryButtonWhilePlaying.closest("[inert]")).not.toBeNull();
    rerender(
      <DesktopQuizLayout
        modeLabel="テストモード"
        heading="見出し"
        round={answeredRound}
        actions={{ reveal: vi.fn(), giveUp: vi.fn() }}
        answer={noopAnswer}
        afterAnswer={{ primaryAction: { label: "結果を見る", onClick: vi.fn() } }}
      />,
    );

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "結果を見る" }));
  });

  it("フォーカスされた主ボタンの click で primaryAction が呼ばれる", () => {
    const onClick = vi.fn();
    renderLayout(answeredRound, { primaryAction: { label: "結果を見る", onClick } });

    const button = screen.getByRole("button", { name: "結果を見る" });
    expect(document.activeElement).toBe(button);
    button.click();

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
