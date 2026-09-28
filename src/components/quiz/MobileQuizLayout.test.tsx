// @vitest-environment jsdom
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

    // 操作エリアは状態ごとの自然な高さで表示するため、playing中は主ボタンをDOMに持たない
    // （高さ測定用の複製はaria-hiddenの内側にあり、アクセシビリティツリーからは見えない）
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

describe("MobileQuizLayout - 操作エリアの高さと空白", () => {
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
});

describe("MobileQuizLayout - 回答後の面が短いときのスクロール領域側の余白", () => {
  // jsdomはレイアウトを計算しないため、ResizeObserverのコールバックを直接呼び出せる
  // スタブに差し替えて、差分の計算だけを検証する
  let observedCallback: ResizeObserverCallback | null = null;

  beforeEach(() => {
    observedCallback = null;
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: ResizeObserverCallback) {
          observedCallback = cb;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("answered中に回答後の面が開示面より低いとき、その差分だけスクロール領域末尾に余白を確保する", () => {
    const { container } = renderLayout(answeredRound, {
      primaryAction: { label: "次の問題へ", onClick: vi.fn() },
    });

    // 開示面（footer）が常に1番目、回答後の面（revealed）が常に2番目。表示状態は
    // invisible/inertだけで切り替わり、DOM上の位置は答え合わせの前後で変わらない。
    // refは各ラッパーの内側のdivに付いている
    const [footerWrapper, revealedWrapper] = Array.from(
      container.querySelectorAll("[data-quiz-footer-area] > div"),
    ) as HTMLElement[];
    const footerEl = footerWrapper.firstElementChild as HTMLElement;
    const revealedEl = revealedWrapper.firstElementChild as HTMLElement;

    act(() => {
      observedCallback?.(
        [
          { target: revealedEl, contentRect: { height: 100 } } as unknown as ResizeObserverEntry,
          { target: footerEl, contentRect: { height: 160 } } as unknown as ResizeObserverEntry,
        ],
        {} as ResizeObserver,
      );
    });

    // 差分（160-100=60）に、立ち絵枠のスクロール位置決めに必要な余白（64px、
    // MobileQuizLayout側のrestingPositionScrollHeadroom）を足した値になる
    const spacer = container.querySelector("[data-portrait-spacer]") as HTMLElement | null;
    expect(spacer).not.toBeNull();
    expect(spacer?.style.height).toBe("124px");
  });

  it("answered中に差分が無くても、スクロール位置決め用の余白ぶんの領域は常に確保する", () => {
    const { container } = renderLayout(answeredRound, {
      primaryAction: { label: "次の問題へ", onClick: vi.fn() },
    });

    const [footerWrapper, revealedWrapper] = Array.from(
      container.querySelectorAll("[data-quiz-footer-area] > div"),
    ) as HTMLElement[];
    const footerEl = footerWrapper.firstElementChild as HTMLElement;
    const revealedEl = revealedWrapper.firstElementChild as HTMLElement;

    act(() => {
      observedCallback?.(
        [
          { target: revealedEl, contentRect: { height: 150 } } as unknown as ResizeObserverEntry,
          { target: footerEl, contentRect: { height: 150 } } as unknown as ResizeObserverEntry,
        ],
        {} as ResizeObserver,
      );
    });

    const spacer = container.querySelector("[data-portrait-spacer]") as HTMLElement | null;
    expect(spacer).not.toBeNull();
    expect(spacer?.style.height).toBe("64px");
  });
});
