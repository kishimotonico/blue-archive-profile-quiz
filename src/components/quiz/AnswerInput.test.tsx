// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { useState, type HTMLAttributes } from "react";
import { describe, it, expect, vi } from "vitest";
import AnswerInput from "./AnswerInput";
import type { AnswerError } from "./quizLayoutTypes";

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
function Wrapper({ onSubmit, error }: { onSubmit: (value: string) => void; error: AnswerError }) {
  const [value, setValue] = useState("");
  return (
    <AnswerInput
      value={value}
      onChange={setValue}
      onSubmit={() => onSubmit(value)}
      error={error}
      errorVisible={error.key > 0}
      onDismissError={() => {}}
    />
  );
}

describe("AnswerInput - controlled入力", () => {
  it("回答するボタンを押すと onSubmit が呼ばれる", () => {
    const onSubmit = vi.fn();
    render(<Wrapper onSubmit={onSubmit} error={{ message: null, key: 0 }} />);

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
        error={{ message: null, key: 0 }}
        errorVisible={false}
        onDismissError={vi.fn()}
      />,
    );

    expect((screen.getByRole("button", { name: "回答する" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});

describe("AnswerInput - エラー表示", () => {
  it("errorVisible が true のとき、エラーメッセージの吹き出しを表示する", () => {
    render(
      <AnswerInput
        value="あああ"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        error={{ message: "該当する生徒が見つかりません", key: 1 }}
        errorVisible={true}
        onDismissError={vi.fn()}
      />,
    );

    expect(screen.getByText("該当する生徒が見つかりません")).toBeTruthy();
  });

  it("吹き出しをクリックすると onDismissError が呼ばれる", () => {
    const onDismissError = vi.fn();
    render(
      <AnswerInput
        value="あああ"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        error={{ message: "該当する生徒が見つかりません", key: 1 }}
        errorVisible={true}
        onDismissError={onDismissError}
      />,
    );

    fireEvent.click(screen.getByText("該当する生徒が見つかりません"));
    expect(onDismissError).toHaveBeenCalled();
  });
});

describe("AnswerInput - シェイクの再生条件", () => {
  it("error.key が0より大きい状態でマウントしても、シェイクは再生しない（レイアウト切り替えの再マウントを想定）", () => {
    startMock.mockClear();
    render(
      <AnswerInput
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        error={{ message: "該当する生徒が見つかりません", key: 3 }}
        errorVisible={true}
        onDismissError={vi.fn()}
      />,
    );

    expect(startMock).not.toHaveBeenCalled();
  });

  it("error.key が変わるとシェイクを再生する", () => {
    startMock.mockClear();
    const { rerender } = render(
      <AnswerInput
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        error={{ message: null, key: 0 }}
        errorVisible={false}
        onDismissError={vi.fn()}
      />,
    );
    expect(startMock).not.toHaveBeenCalled();

    rerender(
      <AnswerInput
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        error={{ message: "該当する生徒が見つかりません", key: 1 }}
        errorVisible={true}
        onDismissError={vi.fn()}
      />,
    );

    expect(startMock).toHaveBeenCalledTimes(1);
  });

  it("同じ error.key のまま再レンダリングされても再生しない", () => {
    startMock.mockClear();
    const { rerender } = render(
      <AnswerInput
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        error={{ message: "該当する生徒が見つかりません", key: 1 }}
        errorVisible={true}
        onDismissError={vi.fn()}
      />,
    );

    rerender(
      <AnswerInput
        value="a"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        error={{ message: "該当する生徒が見つかりません", key: 1 }}
        errorVisible={true}
        onDismissError={vi.fn()}
      />,
    );

    expect(startMock).not.toHaveBeenCalled();
  });
});
