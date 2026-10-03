// @vitest-environment jsdom
import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import QuizScreen from "./QuizScreen";
import { roundReducer } from "../../quiz-core";
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
        afterAnswer={props.afterAnswer ?? defaultAfterAnswer}
      />
    </MemoryRouter>,
  );
}

// round を実際に useState で持ち、submit/giveUp が roundReducer で本物の状態遷移をするハーネス。
// QuizBody の flushSync + フォーカスは、呼び出し元（controller）の状態更新が実際に
// 同期的にDOMへ反映されて初めて機能するため、round を外から書き換えるだけの
// renderScreen では再現できない
function renderStatefulScreen(initialRound: RoundState) {
  function Harness() {
    const [round, setRound] = useState(initialRound);
    const submit = (answer: string): SubmitOutcome => {
      setRound((prev) =>
        roundReducer(prev, {
          type: "submit",
          answer,
          correct: answer === initialRound.question.student.name,
        }),
      );
      return "accepted";
    };
    const giveUp = () => {
      setRound((prev) => roundReducer(prev, { type: "giveUp" }));
    };
    return (
      <QuizScreen
        modeLabel="テストモード"
        heading="見出し"
        questionId="q1"
        round={round}
        actions={{ reveal: vi.fn(), giveUp, submit }}
        afterAnswer={defaultAfterAnswer}
      />
    );
  }
  return render(
    <MemoryRouter>
      <Harness />
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

  it("回答済みの状態でマウントされても主ボタンにフォーカスしない", () => {
    renderScreen({ questionId: "q1", round: answeredRound("s1") });

    expect(document.activeElement).toBe(document.body);
  });

  it("submit で回答が確定すると主ボタンにフォーカスが移る", () => {
    renderStatefulScreen(playingRound("s1"));

    const input = screen.getByPlaceholderText("生徒名を入力") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "陸八魔アル" } });
    fireEvent.click(screen.getByRole("button", { name: "回答する" }));

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "次の問題へ" }));
  });

  it("giveUp で回答が確定すると主ボタンにフォーカスが移る", () => {
    renderStatefulScreen({ status: "playing", question: makeQuestion("s1"), revealedHintCount: 4 });

    fireEvent.click(screen.getByRole("button", { name: "諦めて正解を表示" }));

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "次の問題へ" }));
  });

  it("主ボタンの click で primaryAction.onClick が呼ばれる", () => {
    const onClick = vi.fn();
    renderScreen({
      questionId: "q1",
      round: answeredRound("s1"),
      afterAnswer: { primaryAction: { label: "次の問題へ", onClick } },
    });

    screen.getByRole("button", { name: "次の問題へ" }).click();

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe.each([
  ["モバイル", false],
  ["デスクトップ", true],
])("QuizScreen - 問題開始時の開示ボタンへのフォーカス（%s）", (_name, isDesktop) => {
  beforeEach(() => {
    isDesktopMock.mockReturnValue(isDesktop);
  });

  const screenFor = (questionId: string) => (
    <MemoryRouter>
      <QuizScreen
        modeLabel="テストモード"
        heading="見出し"
        questionId={questionId}
        round={playingRound("s1")}
        actions={{ reveal: vi.fn(), giveUp: vi.fn(), submit: vi.fn() }}
        afterAnswer={defaultAfterAnswer}
      />
    </MemoryRouter>
  );

  it("ページを開いた最初の問題では開示ボタンにフォーカスしない", () => {
    renderScreen({ questionId: "q1", round: playingRound("s1") });

    expect(document.activeElement).toBe(document.body);
  });

  it("questionId が変わった後の問題では開示ボタンにフォーカスする", () => {
    const { rerender } = render(screenFor("q1"));
    rerender(screenFor("q2"));

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "次のヒントを開示" }));
  });
});

describe.each([
  ["モバイル", false],
  ["デスクトップ", true],
])("QuizScreen - 回答した瞬間の演出（%s）", (_name, isDesktop) => {
  const ripple = () => document.querySelector("[data-celebrate-ripple]");
  const revealAnswer = () => document.querySelector(".ba-reveal-answer");

  beforeEach(() => {
    isDesktopMock.mockReturnValue(isDesktop);
  });

  it("この画面で正解したときだけ波紋が出る", () => {
    renderStatefulScreen(playingRound("s1"));
    expect(ripple()).toBeNull();

    fireEvent.change(screen.getByPlaceholderText("生徒名を入力"), { target: { value: "s1" } });
    fireEvent.click(screen.getByRole("button", { name: "回答する" }));

    expect(ripple()).not.toBeNull();
  });

  it("正解では答えの名前に演出が付かない", () => {
    renderStatefulScreen(playingRound("s1"));

    fireEvent.change(screen.getByPlaceholderText("生徒名を入力"), { target: { value: "s1" } });
    fireEvent.click(screen.getByRole("button", { name: "回答する" }));

    expect(revealAnswer()).toBeNull();
  });

  it("最初から answered の状態で描画したときは出ない", () => {
    renderStatefulScreen(answeredRound("s1"));

    expect(ripple()).toBeNull();
    expect(revealAnswer()).toBeNull();
  });

  it("ギブアップでは波紋が出ず、答えの名前だけ演出が付く", () => {
    renderStatefulScreen({ status: "playing", question: makeQuestion("s1"), revealedHintCount: 4 });

    fireEvent.click(screen.getByRole("button", { name: "諦めて正解を表示" }));

    expect(ripple()).toBeNull();
    expect(revealAnswer()).not.toBeNull();
  });

  it("この画面で不正解にしたとき、答えの名前に演出が付く", () => {
    renderStatefulScreen(playingRound("s1"));

    fireEvent.change(screen.getByPlaceholderText("生徒名を入力"), {
      target: { value: "ぜんぜん違う名前" },
    });
    fireEvent.click(screen.getByRole("button", { name: "回答する" }));

    expect(ripple()).toBeNull();
    expect(revealAnswer()).not.toBeNull();
  });
});
