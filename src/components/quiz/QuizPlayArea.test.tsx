// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { createRef, useState } from "react";
import { describe, it, expect, vi } from "vitest";
import QuizPlayArea from "./QuizPlayArea";

// QuizScreen は key を変えることでQuizPlayArea（＝AnswerInputの入力状態）を
// 問題ごとに作り直す。ここでは呼び出し側の使い方に合わせ、key を切り替える
// ラッパーコンポーネントで再現する。
function Wrapper({ playAreaKey }: { playAreaKey: string }) {
  const hintButtonRef = createRef<HTMLButtonElement>();
  return (
    <QuizPlayArea
      key={playAreaKey}
      hintButtonRef={hintButtonRef}
      revealedHintCount={1}
      hintsLength={3}
      revealNextHint={vi.fn()}
      submitAnswer={vi.fn()}
      giveUp={vi.fn()}
      answerFeedback={null}
      errorKey={0}
    />
  );
}

describe("QuizPlayArea - key変更による入力リセット", () => {
  it("key が変わると入力欄が空に戻る", () => {
    const { rerender } = render(<Wrapper playAreaKey="student-a" />);

    const input = screen.getByPlaceholderText("生徒名を入力") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "アル" } });
    expect(input.value).toBe("アル");

    rerender(<Wrapper playAreaKey="student-b" />);

    const nextInput = screen.getByPlaceholderText("生徒名を入力") as HTMLInputElement;
    expect(nextInput.value).toBe("");
  });

  it("key が同じままなら入力欄は保持される", () => {
    function ParentWithState() {
      const [, setTick] = useState(0);
      return (
        <>
          <button onClick={() => setTick((t) => t + 1)}>rerender</button>
          <Wrapper playAreaKey="student-a" />
        </>
      );
    }

    render(<ParentWithState />);
    const input = screen.getByPlaceholderText("生徒名を入力") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "アル" } });

    fireEvent.click(screen.getByRole("button", { name: "rerender" }));

    expect((screen.getByPlaceholderText("生徒名を入力") as HTMLInputElement).value).toBe("アル");
  });
});
