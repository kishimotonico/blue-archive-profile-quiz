// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MobileQuizLayout from "./MobileQuizLayout";
import type { Hint, QuestionResult, QuizQuestion, RoundState, Student } from "../../quiz-core";
import type { AfterAnswer, AnswerDraft } from "./quizLayoutTypes";

// jsdomにはscrollIntoViewが無いため、展開時の立ち絵スクロールをスタブする
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

    // 操作エリアは常に両方の面をDOMに持ち、invisible/inertで表示だけ切り替えるため、
    // playing中は回答後の主ボタンがアクセシビリティツリー上に現れない
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

describe("MobileQuizLayout - 操作エリアの出し分け", () => {
  it("playing中は回答後の面をアクセシビリティツリー上に持たず、開示ボタンは1つだけ見える", () => {
    renderLayout(playingRound, { primaryAction: { label: "次の問題へ", onClick: vi.fn() } });

    expect(screen.getAllByRole("button", { name: "シルエットを表示" })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "次の問題へ" })).toBeNull();
  });

  it("answered中は開示ボタンをアクセシビリティツリー上に持たず、主ボタンは1つだけ見える", () => {
    renderLayout(answeredRound, { primaryAction: { label: "次の問題へ", onClick: vi.fn() } });

    expect(screen.getAllByRole("button", { name: "次の問題へ" })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "シルエットを表示" })).toBeNull();
  });

  it("answered中は正誤・得点・生徒名を1行にまとめて表示する", () => {
    renderLayout(answeredRound, { primaryAction: { label: "次の問題へ", onClick: vi.fn() } });

    expect(screen.getByText("正解！")).not.toBeNull();
    expect(screen.getByText("10")).not.toBeNull();
    expect(screen.getByText(question.student.fullName)).not.toBeNull();
  });
});

describe("MobileQuizLayout - 展開の瞬間の位置決め（scrollIntoView）", () => {
  beforeEach(() => {
    (Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>).mockClear();
  });

  it("最後のヒントを開示してシルエットに変わる操作では、一度だけscrollIntoViewする", () => {
    renderLayout(playingRound, { primaryAction: { label: "次の問題へ", onClick: vi.fn() } });

    screen.getByRole("button", { name: "シルエットを表示" }).click();

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: "end" });
  });

  it("まだヒントが残っている開示操作ではscrollIntoViewしない", () => {
    const twoHintQuestion: QuizQuestion = {
      ...question,
      hints: [
        { type: "school", label: "学園", value: "テスト学園" },
        { type: "club", label: "部活", value: "テスト部" },
      ],
    };
    const round: RoundState = {
      status: "playing",
      question: twoHintQuestion,
      revealedHintCount: 1,
    };
    renderLayout(round, { primaryAction: { label: "次の問題へ", onClick: vi.fn() } });

    screen.getByRole("button", { name: "次のヒントを開示" }).click();

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("シルエット表示中の回答（回答するボタン）ではscrollIntoViewしない（既に展開済みのため）", () => {
    const silhouetteRound: RoundState = {
      status: "playing",
      question,
      revealedHintCount: question.hints.length + 1,
    };
    render(
      <MobileQuizLayout
        modeLabel="テストモード"
        heading="見出し"
        round={silhouetteRound}
        actions={{ reveal: vi.fn(), giveUp: vi.fn() }}
        answer={{ ...noopAnswer, value: "タロウ" }}
        afterAnswer={{ primaryAction: { label: "次の問題へ", onClick: vi.fn() } }}
      />,
    );

    screen.getByRole("button", { name: "回答する" }).click();

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("ヒント途中でも回答（hidden→revealed直行）すると、一度だけscrollIntoViewする", () => {
    render(
      <MobileQuizLayout
        modeLabel="テストモード"
        heading="見出し"
        round={playingRound}
        actions={{ reveal: vi.fn(), giveUp: vi.fn() }}
        answer={{ ...noopAnswer, value: "タロウ" }}
        afterAnswer={{ primaryAction: { label: "次の問題へ", onClick: vi.fn() } }}
      />,
    );

    screen.getByRole("button", { name: "回答する" }).click();

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: "end" });
  });
});
