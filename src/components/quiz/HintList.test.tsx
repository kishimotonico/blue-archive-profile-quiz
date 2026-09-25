// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import HintList from "./HintList";
import type { Hint } from "../../quiz-core";

const mockHints: Hint[] = [
  { type: "school", label: "学園", value: "VAL_1" },
  { type: "club", label: "部活", value: "VAL_2" },
];

const manyHints: Hint[] = [
  { type: "school", label: "学園", value: "VAL_1" },
  { type: "club", label: "部活", value: "VAL_2" },
  { type: "age", label: "年齢", value: "VAL_3" },
  { type: "birthday", label: "誕生日", value: "VAL_4" },
];

describe("HintList - 「残り n ヒント」の帯", () => {
  it("layout=desktop では帯を表示しない", () => {
    render(<HintList hints={manyHints} visibleCount={1} animateReveal layout="desktop" />);

    expect(screen.queryByText(/残り/)).toBeNull();
  });

  it("layout=mobile かつ残り2枚以上では帯を表示する", () => {
    render(<HintList hints={manyHints} visibleCount={1} animateReveal layout="mobile" />);

    expect(screen.getByText(/残り 3 ヒント/)).toBeTruthy();
  });
});

describe("HintList - 開示演出のスクロール", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("animateReveal=true で visibleCount が増えると開示位置へスクロールする", () => {
    const { rerender } = render(
      <HintList hints={mockHints} visibleCount={1} animateReveal layout="mobile" />,
    );
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();

    rerender(<HintList hints={mockHints} visibleCount={2} animateReveal layout="mobile" />);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("animateReveal=false のときは visibleCount が増えてもスクロールしない（回答確定で一斉に開くケース）", () => {
    const { rerender } = render(
      <HintList hints={mockHints} visibleCount={1} animateReveal={false} layout="mobile" />,
    );

    rerender(<HintList hints={mockHints} visibleCount={2} animateReveal={false} layout="mobile" />);

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});
