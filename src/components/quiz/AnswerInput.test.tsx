// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { useState, type HTMLAttributes } from "react";
import { describe, it, expect, vi } from "vitest";
import AnswerInput from "./AnswerInput";
import type { AnswerFeedbackError } from "./quizLayoutTypes";

const startMock = vi.hoisted(() => vi.fn());

// shake演出（motionのcontrols.start）の呼び出し有無だけを検証したいため、
// motion.divは通常のdivに、useAnimationControlsはstartをスパイできるスタブに差し替える
vi.mock("motion/react", () => ({
  motion: {
    div: ({
      animate: _animate,
      ...props
    }: HTMLAttributes<HTMLDivElement> & { animate?: unknown }) => <div {...props} />,
  },
  useAnimationControls: () => ({ start: startMock }),
}));

// AnswerInput は controlled のため、呼び出し側（QuizBody 相当）の状態管理を
// テスト用の小さなラッパーで再現する
function Wrapper({
  onSubmit,
  error,
}: {
  onSubmit: (value: string) => "accepted" | "unknownStudent";
  error: AnswerFeedbackError | null;
}) {
  const [value, setValue] = useState("");
  return (
    <AnswerInput
      value={value}
      onChange={setValue}
      onSubmit={() => onSubmit(value)}
      error={error}
      onDismissError={() => {}}
    />
  );
}

describe("AnswerInput - controlled入力", () => {
  it("回答するボタンを押すと onSubmit が呼ばれる", () => {
    const onSubmit = vi.fn().mockReturnValue("accepted" as const);
    render(<Wrapper onSubmit={onSubmit} error={null} />);

    const input = screen.getByPlaceholderText("生徒名を入力") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "陸八魔アル" } });
    fireEvent.click(screen.getByRole("button", { name: "回答する" }));

    expect(onSubmit).toHaveBeenCalledWith("陸八魔アル");
  });

  it("入力が空のときは回答するボタンが disabled になる", () => {
    render(
      <AnswerInput
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        error={null}
        onDismissError={vi.fn()}
      />,
    );

    expect((screen.getByRole("button", { name: "回答する" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});

describe("AnswerInput - エラー表示", () => {
  it("error があるとき、エラーメッセージの吹き出しを role=alert で表示する", () => {
    render(
      <AnswerInput
        value="あああ"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        error={{ message: "該当する生徒が見つかりません", attempt: 1 }}
        onDismissError={vi.fn()}
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("該当する生徒が見つかりません");
  });

  it("error があるとき、入力欄に aria-invalid と aria-describedby が付く", () => {
    render(
      <AnswerInput
        value="あああ"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        error={{ message: "該当する生徒が見つかりません", attempt: 1 }}
        onDismissError={vi.fn()}
      />,
    );

    const input = screen.getByLabelText("生徒名");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(screen.getByRole("alert").id);
  });

  it("error が null のときは吹き出しを表示せず、入力欄も invalid にしない", () => {
    render(
      <AnswerInput
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        error={null}
        onDismissError={vi.fn()}
      />,
    );

    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByLabelText("生徒名").getAttribute("aria-invalid")).toBe("false");
  });

  it("吹き出しをクリックすると onDismissError が呼ばれる", () => {
    const onDismissError = vi.fn();
    render(
      <AnswerInput
        value="あああ"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        error={{ message: "該当する生徒が見つかりません", attempt: 1 }}
        onDismissError={onDismissError}
      />,
    );

    fireEvent.click(screen.getByText("該当する生徒が見つかりません"));
    expect(onDismissError).toHaveBeenCalled();
  });
});

describe("AnswerInput - シェイクの再生条件", () => {
  it("送信結果が unknownStudent のときだけシェイクを再生する", () => {
    startMock.mockClear();
    const onSubmit = vi.fn().mockReturnValue("unknownStudent" as const);
    render(
      <AnswerInput
        value="あ"
        onChange={vi.fn()}
        onSubmit={onSubmit}
        error={null}
        onDismissError={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "回答する" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(startMock).toHaveBeenCalledTimes(1);
  });

  it("送信結果が accepted のときはシェイクを再生しない", () => {
    startMock.mockClear();
    const onSubmit = vi.fn().mockReturnValue("accepted" as const);
    render(
      <AnswerInput
        value="あ"
        onChange={vi.fn()}
        onSubmit={onSubmit}
        error={null}
        onDismissError={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "回答する" }));

    expect(startMock).not.toHaveBeenCalled();
  });

  it("エラーがある状態でマウントしただけでは（送信していないので）シェイクは再生しない", () => {
    startMock.mockClear();
    render(
      <AnswerInput
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        error={{ message: "該当する生徒が見つかりません", attempt: 3 }}
        onDismissError={vi.fn()}
      />,
    );

    expect(startMock).not.toHaveBeenCalled();
  });
});
