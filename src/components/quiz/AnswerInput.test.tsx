// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AnswerInput from "./AnswerInput";

describe("AnswerInput - 送信後の入力保持", () => {
  it("onSubmitがfalseを返す（該当する生徒が見つからない）ときは入力欄の文字が残る", () => {
    const onSubmit = vi.fn().mockReturnValue(false);
    render(<AnswerInput onSubmit={onSubmit} error="該当する生徒が見つかりません" errorKey={1} />);

    const input = screen.getByPlaceholderText("生徒名を入力") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "あああ" } });
    fireEvent.click(screen.getByRole("button", { name: "回答する" }));

    expect(onSubmit).toHaveBeenCalledWith("あああ");
    expect(input.value).toBe("あああ");
  });

  it("onSubmitがtrueを返す（誤答・正解）ときは入力欄が空になる", () => {
    const onSubmit = vi.fn().mockReturnValue(true);
    render(<AnswerInput onSubmit={onSubmit} error={null} errorKey={0} />);

    const input = screen.getByPlaceholderText("生徒名を入力") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "陸八魔アル" } });
    fireEvent.click(screen.getByRole("button", { name: "回答する" }));

    expect(onSubmit).toHaveBeenCalledWith("陸八魔アル");
    expect(input.value).toBe("");
  });
});
