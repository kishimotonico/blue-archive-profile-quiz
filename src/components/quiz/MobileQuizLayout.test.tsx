// @vitest-environment jsdom
import { createRef, useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MobileQuizLayout from "./MobileQuizLayout";
import { roundReducer } from "../../quiz-core";
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
  onSubmit: vi.fn().mockReturnValue("accepted"),
  error: null,
  dismissError: vi.fn(),
};

function renderLayout(
  round: RoundState,
  afterAnswer: AfterAnswer,
  options: { answer?: AnswerDraft; autoFocusOnMount?: boolean } = {},
) {
  const primaryButtonRef = createRef<HTMLButtonElement>();
  const utils = render(
    <MobileQuizLayout
      modeLabel="テストモード"
      heading="見出し"
      round={round}
      actions={{ reveal: vi.fn(), giveUp: vi.fn() }}
      answer={options.answer ?? noopAnswer}
      afterAnswer={afterAnswer}
      primaryButtonRef={primaryButtonRef}
      autoFocusOnMount={options.autoFocusOnMount ?? true}
    />,
  );
  return { ...utils, primaryButtonRef };
}

// actions.reveal は実際にroundを進めるreducerと繋ぐ。展開・スクロールの判定はflushSync後の
// 実DOMを見て行うため、propsを外から書き換えるだけのrenderLayoutでは再現できない
function renderStatefulLayout(initialRound: RoundState, afterAnswer: AfterAnswer) {
  function Harness() {
    const [round, setRound] = useState(initialRound);
    const primaryButtonRef = createRef<HTMLButtonElement>();
    return (
      <MobileQuizLayout
        modeLabel="テストモード"
        heading="見出し"
        round={round}
        actions={{
          reveal: () => setRound((prev) => roundReducer(prev, { type: "reveal" })),
          giveUp: () => setRound((prev) => roundReducer(prev, { type: "giveUp" })),
        }}
        answer={noopAnswer}
        afterAnswer={afterAnswer}
        primaryButtonRef={primaryButtonRef}
        autoFocusOnMount
      />
    );
  }
  return render(<Harness />);
}

describe("MobileQuizLayout - マウント時のフォーカス", () => {
  it("answered状態・autoFocusOnMountでマウントされると主ボタンにフォーカスがある", () => {
    renderLayout(answeredRound, { primaryAction: { label: "次の問題へ", onClick: vi.fn() } });

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "次の問題へ" }));
  });

  it("playing状態でマウントされると、開示ボタンにフォーカスがある", () => {
    renderLayout(playingRound, { primaryAction: { label: "次の問題へ", onClick: vi.fn() } });

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "シルエットを表示" }));
  });

  it("autoFocusOnMount=false なら answered 状態でマウントされてもフォーカスしない", () => {
    renderLayout(
      answeredRound,
      { primaryAction: { label: "次の問題へ", onClick: vi.fn() } },
      { autoFocusOnMount: false },
    );

    expect(document.activeElement).not.toBe(screen.getByRole("button", { name: "次の問題へ" }));
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
  it("playing中は回答後の面がinertになり、開示ボタン側が操作できる", () => {
    renderLayout(playingRound, { primaryAction: { label: "次の問題へ", onClick: vi.fn() } });

    expect(screen.getByRole("button", { name: "シルエットを表示" }).closest("[inert]")).toBeNull();
    expect(screen.getByRole("button", { name: "次の問題へ" }).closest("[inert]")).not.toBeNull();
  });

  it("answered中は開示ボタン側の面がinertになり、主ボタン側が操作できる", () => {
    renderLayout(answeredRound, { primaryAction: { label: "次の問題へ", onClick: vi.fn() } });

    expect(screen.getByRole("button", { name: "次の問題へ" }).closest("[inert]")).toBeNull();
    // answered中はQuizPlayAreaが諦めボタンではなく非表示のプレースホルダを描画する
    expect(screen.getByText("諦めて正解を表示").closest("[inert]")).not.toBeNull();
  });

  it("answered中は正誤・得点・生徒名を1行にまとめて表示する", () => {
    renderLayout(answeredRound, { primaryAction: { label: "次の問題へ", onClick: vi.fn() } });

    expect(screen.getByText("正解！")).not.toBeNull();
    expect(screen.getByText("10")).not.toBeNull();
    expect(screen.getByText(question.student.fullName)).not.toBeNull();
  });
});

describe("MobileQuizLayout - 展開・スクロールの位置決め（scrollIntoView）", () => {
  beforeEach(() => {
    (Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>).mockClear();
  });

  it("最後のヒントを開示してシルエットに変わる操作では、一度だけ立ち絵枠へscrollIntoViewする", () => {
    renderLayout(playingRound, { primaryAction: { label: "次の問題へ", onClick: vi.fn() } });

    screen.getByRole("button", { name: "シルエットを表示" }).click();

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: "end" });
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
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: "center" });
  });

  it("シルエット表示中の回答（回答するボタン）ではscrollIntoViewしない（既に展開済みのため）", () => {
    const silhouetteRound: RoundState = {
      status: "playing",
      question,
      revealedHintCount: question.hints.length + 1,
    };
    renderLayout(
      silhouetteRound,
      { primaryAction: { label: "次の問題へ", onClick: vi.fn() } },
      { answer: { ...noopAnswer, value: "タロウ" } },
    );

    screen.getByRole("button", { name: "回答する" }).click();

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("ヒント途中でも回答（hidden→revealed直行）すると、一度だけscrollIntoViewする", () => {
    renderLayout(
      playingRound,
      { primaryAction: { label: "次の問題へ", onClick: vi.fn() } },
      { answer: { ...noopAnswer, value: "タロウ" } },
    );

    screen.getByRole("button", { name: "回答する" }).click();

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: "end" });
  });

  it("回答欄が unknownStudent を返したときは、枠が hidden のままでもscrollIntoViewしない", () => {
    renderLayout(
      playingRound,
      { primaryAction: { label: "次の問題へ", onClick: vi.fn() } },
      {
        answer: {
          ...noopAnswer,
          value: "存在しない生徒",
          onSubmit: vi.fn().mockReturnValue("unknownStudent"),
        },
      },
    );

    screen.getByRole("button", { name: "回答する" }).click();

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});
