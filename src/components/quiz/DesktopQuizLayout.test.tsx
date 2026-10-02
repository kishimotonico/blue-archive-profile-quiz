// @vitest-environment jsdom
import { createRef, useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DesktopQuizLayout from "./DesktopQuizLayout";
import { roundReducer } from "../../quiz-core";
import type { Hint, QuestionResult, QuizQuestion, RoundState, Student } from "../../quiz-core";
import type { AfterAnswer, AnswerDraft } from "./quizLayoutTypes";

// jsdomにはscrollIntoViewが無いため、開示時のヒントカードへのスクロールをスタブする
Element.prototype.scrollIntoView = vi.fn();

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
  onSubmit: vi.fn().mockReturnValue("accepted"),
  error: null,
  dismissError: vi.fn(),
};

function renderLayout(round: RoundState, afterAnswer: AfterAnswer) {
  const primaryButtonRef = createRef<HTMLButtonElement>();
  const utils = render(
    <DesktopQuizLayout
      modeLabel="テストモード"
      heading="見出し"
      round={round}
      actions={{ reveal: vi.fn(), giveUp: vi.fn() }}
      answer={noopAnswer}
      afterAnswer={afterAnswer}
      justAnswered={false}
      focusHintOnStart
      primaryButtonRef={primaryButtonRef}
    />,
  );
  return { ...utils, primaryButtonRef };
}

// actions.reveal は実際にroundを進めるreducerと繋ぐ。開示直後のスクロール判定はflushSync後の
// 実DOMを見て行うため、propsを外から書き換えるだけのrenderLayoutでは再現できない
function renderStatefulLayout(initialRound: RoundState, afterAnswer: AfterAnswer) {
  function Harness() {
    const [round, setRound] = useState(initialRound);
    const primaryButtonRef = createRef<HTMLButtonElement>();
    return (
      <DesktopQuizLayout
        modeLabel="テストモード"
        heading="見出し"
        round={round}
        actions={{
          reveal: () => setRound((prev) => roundReducer(prev, { type: "reveal" })),
          giveUp: () => setRound((prev) => roundReducer(prev, { type: "giveUp" })),
        }}
        answer={noopAnswer}
        afterAnswer={afterAnswer}
        justAnswered={false}
        focusHintOnStart
        primaryButtonRef={primaryButtonRef}
      />
    );
  }
  return render(<Harness />);
}

describe("DesktopQuizLayout - マウント時の主ボタンへのフォーカス", () => {
  it("answered状態でマウントされても主ボタンにはフォーカスしない（回答直後のフォーカスは QuizBody が担う）", () => {
    renderLayout(answeredRound, { primaryAction: { label: "結果を見る", onClick: vi.fn() } });

    expect(document.activeElement).not.toBe(screen.getByRole("button", { name: "結果を見る" }));
  });

  it("playing状態でマウントされると、主ボタンにはフォーカスしない（開示ボタン側に譲る）", () => {
    renderLayout(playingRound, { primaryAction: { label: "結果を見る", onClick: vi.fn() } });

    // 立ち絵パネルの高さを answered/playing で変えないため、ボタンは playing 中も
    // mount されたまま、親セルが invisible になっている
    const primaryButton = screen.getByRole("button", { name: "結果を見る" });
    expect(primaryButton.closest(".invisible")).not.toBeNull();
    expect(document.activeElement).not.toBe(primaryButton);
    // 代わりに開示ボタン側へ autoFocus する
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "シルエットを表示" }));
  });

  it("主ボタンの click で primaryAction が呼ばれる", () => {
    const onClick = vi.fn();
    renderLayout(answeredRound, { primaryAction: { label: "結果を見る", onClick } });

    const button = screen.getByRole("button", { name: "結果を見る" });
    button.click();

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("DesktopQuizLayout - ヒント開示時のスクロール位置決め（scrollIntoView）", () => {
  beforeEach(() => {
    (Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>).mockClear();
  });

  it("まだヒントが残っている開示操作では、新しく開示したヒントカードへscrollIntoViewする", () => {
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
    renderStatefulLayout(round, { primaryAction: { label: "次の問題へ", onClick: vi.fn() } });

    fireEvent.click(screen.getByRole("button", { name: "次のヒントを開示" }));

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
  });

  it("最後のヒントを開示してシルエットに変わる操作ではscrollIntoViewしない（立ち絵パネルは常に画面内のため）", () => {
    renderStatefulLayout(playingRound, {
      primaryAction: { label: "次の問題へ", onClick: vi.fn() },
    });

    fireEvent.click(screen.getByRole("button", { name: "シルエットを表示" }));

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});
