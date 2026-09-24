// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import QuizScreen from "./QuizScreen";
import type {
  Hint,
  QuestionResult,
  QuizQuestion,
  RoundState,
  Student,
  SubmitOutcome,
} from "../../quiz-core";
import type { AfterAnswer, QuizActions } from "./quizLayoutTypes";

const isDesktopMock = vi.hoisted(() => vi.fn().mockReturnValue(false));

vi.mock("../../hooks/useIsDesktop", () => ({
  useIsDesktop: isDesktopMock,
}));

vi.mock("./portraitImageUrl", () => ({
  getPortraitImageUrl: vi.fn().mockReturnValue("about:blank"),
  NO_IMAGE_URL: "about:blank",
}));

// jsdomにはscrollIntoViewが無いため、回答済みマウント時の立ち絵スクロールをスタブする
Element.prototype.scrollIntoView = vi.fn();

const makeStudent = (id: string): Student => ({
  id,
  fullName: `テスト ${id}`,
  name: id,
  school: "テスト学園",
  grade: "1年生",
  club: "テスト部",
  age: "15歳",
  birthday: "1月1日",
  height: "160cm",
  hobby: "テスト",
  weaponName: "テスト銃",
  cv: "テストCV",
  portraitImage: `images/${id}.png`,
  availableFrom: "2026-04-21",
  skills: { ex: "", normal: "", passive: "", sub: "" },
});

const makeHints = (): Hint[] => [
  { type: "school", label: "学園", value: "VAL_1" },
  { type: "club", label: "部活", value: "VAL_2" },
  { type: "age", label: "年齢", value: "VAL_3" },
];

const makeQuestion = (studentId: string): QuizQuestion => ({
  student: makeStudent(studentId),
  hints: makeHints(),
  key: { version: 2, baseDate: "2026-04-21", seed: 1 },
});

const playingRound = (studentId: string): RoundState => ({
  status: "playing",
  question: makeQuestion(studentId),
  revealedHintCount: 1,
});

const answeredRound = (studentId: string): RoundState => {
  const question = makeQuestion(studentId);
  const result: QuestionResult = {
    studentId: question.student.id,
    usedHintCount: 1,
    correct: true,
    userAnswer: question.student.name,
    score: 10,
  };
  return { status: "answered", question, result };
};

const defaultAfterAnswer: AfterAnswer = {
  primaryAction: { label: "次の問題へ", onClick: vi.fn() },
};

function renderScreen(props: {
  questionId: string;
  round: RoundState;
  actions?: Partial<QuizActions>;
  answerError?: { message: string | null; key: number };
  afterAnswer?: AfterAnswer;
}) {
  const actions: QuizActions = {
    reveal: vi.fn(),
    giveUp: vi.fn(),
    submit: vi.fn<(answer: string) => SubmitOutcome>().mockReturnValue("accepted"),
    ...props.actions,
  };
  return render(
    <MemoryRouter>
      <QuizScreen
        modeLabel="テストモード"
        heading="見出し"
        questionId={props.questionId}
        round={props.round}
        actions={actions}
        answerError={props.answerError ?? { message: null, key: 0 }}
        afterAnswer={props.afterAnswer ?? defaultAfterAnswer}
      />
    </MemoryRouter>,
  );
}

describe("QuizScreen - レイアウト切り替えでの下書き保持", () => {
  beforeEach(() => {
    isDesktopMock.mockReturnValue(false);
  });

  it("useIsDesktop の値が変わっても、questionId が同じなら下書きが残る", () => {
    const { rerender } = renderScreen({ questionId: "q1", round: playingRound("s1") });

    const input = screen.getByPlaceholderText("生徒名を入力") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "アル" } });
    expect(input.value).toBe("アル");

    isDesktopMock.mockReturnValue(true);
    rerender(
      <MemoryRouter>
        <QuizScreen
          modeLabel="テストモード"
          heading="見出し"
          questionId="q1"
          round={playingRound("s1")}
          actions={{
            reveal: vi.fn(),
            giveUp: vi.fn(),
            submit: vi.fn().mockReturnValue("accepted"),
          }}
          answerError={{ message: null, key: 0 }}
          afterAnswer={defaultAfterAnswer}
        />
      </MemoryRouter>,
    );

    const inputAfterSwitch = screen.getByPlaceholderText("生徒名を入力") as HTMLInputElement;
    expect(inputAfterSwitch.value).toBe("アル");
  });
});

describe("QuizScreen - 問題が変わったときのリセット", () => {
  beforeEach(() => {
    isDesktopMock.mockReturnValue(false);
  });

  it("questionId が変わると下書きが空になる", () => {
    const { rerender } = renderScreen({ questionId: "q1", round: playingRound("s1") });

    const input = screen.getByPlaceholderText("生徒名を入力") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "アル" } });
    expect(input.value).toBe("アル");

    rerender(
      <MemoryRouter>
        <QuizScreen
          modeLabel="テストモード"
          heading="見出し"
          questionId="q2"
          round={playingRound("s1")}
          actions={{
            reveal: vi.fn(),
            giveUp: vi.fn(),
            submit: vi.fn().mockReturnValue("accepted"),
          }}
          answerError={{ message: null, key: 0 }}
          afterAnswer={defaultAfterAnswer}
        />
      </MemoryRouter>,
    );

    const nextInput = screen.getByPlaceholderText("生徒名を入力") as HTMLInputElement;
    expect(nextInput.value).toBe("");
  });

  it("同じ生徒が2問続いても questionId が違えば下書きが消える", () => {
    const { rerender } = renderScreen({ questionId: "q1", round: playingRound("s1") });

    const input = screen.getByPlaceholderText("生徒名を入力") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "アル" } });

    rerender(
      <MemoryRouter>
        <QuizScreen
          modeLabel="テストモード"
          heading="見出し"
          questionId="q2"
          round={playingRound("s1")}
          actions={{
            reveal: vi.fn(),
            giveUp: vi.fn(),
            submit: vi.fn().mockReturnValue("accepted"),
          }}
          answerError={{ message: null, key: 0 }}
          afterAnswer={defaultAfterAnswer}
        />
      </MemoryRouter>,
    );

    expect((screen.getByPlaceholderText("生徒名を入力") as HTMLInputElement).value).toBe("");
  });
});

describe("QuizScreen - submitの結果による下書きの扱い", () => {
  beforeEach(() => {
    isDesktopMock.mockReturnValue(false);
  });

  it("unknownStudent のときは下書きが残る", () => {
    const submit = vi.fn<(answer: string) => SubmitOutcome>().mockReturnValue("unknownStudent");
    renderScreen({ questionId: "q1", round: playingRound("s1"), actions: { submit } });

    const input = screen.getByPlaceholderText("生徒名を入力") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "存在しない生徒" } });
    fireEvent.click(screen.getByRole("button", { name: "回答する" }));

    expect(submit).toHaveBeenCalledWith("存在しない生徒");
    expect(input.value).toBe("存在しない生徒");
  });

  it("accepted のときは下書きが空になる", () => {
    const submit = vi.fn<(answer: string) => SubmitOutcome>().mockReturnValue("accepted");
    renderScreen({ questionId: "q1", round: playingRound("s1"), actions: { submit } });

    const input = screen.getByPlaceholderText("生徒名を入力") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "陸八魔アル" } });
    fireEvent.click(screen.getByRole("button", { name: "回答する" }));

    expect(submit).toHaveBeenCalledWith("陸八魔アル");
    expect(input.value).toBe("");
  });
});

describe("QuizScreen - 回答後の主ボタンへのフォーカス", () => {
  beforeEach(() => {
    isDesktopMock.mockReturnValue(false);
  });

  it("回答済みの状態でマウントされると主ボタンにフォーカスがある", () => {
    renderScreen({ questionId: "q1", round: answeredRound("s1") });

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "次の問題へ" }));
  });

  it("submit で回答が確定すると主ボタンにフォーカスが移る", () => {
    const submit = vi.fn<(answer: string) => SubmitOutcome>().mockReturnValue("accepted");
    const { rerender } = renderScreen({
      questionId: "q1",
      round: playingRound("s1"),
      actions: { submit },
    });

    const input = screen.getByPlaceholderText("生徒名を入力") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "陸八魔アル" } });
    fireEvent.click(screen.getByRole("button", { name: "回答する" }));
    expect(submit).toHaveBeenCalledWith("陸八魔アル");

    // controller はここで round を answered に更新し、ページが questionId 据え置きで再レンダーする
    rerender(
      <MemoryRouter>
        <QuizScreen
          modeLabel="テストモード"
          heading="見出し"
          questionId="q1"
          round={answeredRound("s1")}
          actions={{ reveal: vi.fn(), giveUp: vi.fn(), submit }}
          answerError={{ message: null, key: 0 }}
          afterAnswer={defaultAfterAnswer}
        />
      </MemoryRouter>,
    );

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "次の問題へ" }));
  });

  it("giveUp で回答が確定すると主ボタンにフォーカスが移る", () => {
    const giveUp = vi.fn();
    const { rerender } = renderScreen({
      questionId: "q1",
      round: { status: "playing", question: makeQuestion("s1"), revealedHintCount: 4 },
      actions: { giveUp },
    });

    fireEvent.click(screen.getByRole("button", { name: "諦めて正解を表示" }));
    expect(giveUp).toHaveBeenCalledTimes(1);

    rerender(
      <MemoryRouter>
        <QuizScreen
          modeLabel="テストモード"
          heading="見出し"
          questionId="q1"
          round={answeredRound("s1")}
          actions={{ reveal: vi.fn(), giveUp, submit: vi.fn().mockReturnValue("accepted") }}
          answerError={{ message: null, key: 0 }}
          afterAnswer={defaultAfterAnswer}
        />
      </MemoryRouter>,
    );

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "次の問題へ" }));
  });

  it("フォーカスされた主ボタンの click で primaryAction.onClick が呼ばれる（Enter はブラウザが click に変換する）", () => {
    const onClick = vi.fn();
    renderScreen({
      questionId: "q1",
      round: answeredRound("s1"),
      afterAnswer: { primaryAction: { label: "次の問題へ", onClick } },
    });

    const button = screen.getByRole("button", { name: "次の問題へ" });
    expect(document.activeElement).toBe(button);
    button.click();

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
