// @vitest-environment jsdom
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
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

describe("HintList - 開示のきらめき", () => {
  it("animateReveal=true のとき、直近に開示した1枚だけがきらめく", () => {
    render(<HintList hints={mockHints} visibleCount={2} animateReveal layout="mobile" />);

    const cards = screen.getAllByText(/VAL_/).map((el) => el.parentElement);
    expect(cards[0]?.className).not.toContain("ba-shine");
    expect(cards[1]?.className).toContain("ba-shine");
  });

  it("animateReveal=false のときはきらめかない（回答確定で一斉に開くケース）", () => {
    render(<HintList hints={mockHints} visibleCount={2} animateReveal={false} layout="mobile" />);

    const cards = screen.getAllByText(/VAL_/).map((el) => el.parentElement);
    expect(cards.every((el) => !el?.className.includes("ba-shine"))).toBe(true);
  });

  it("justRevealedRef に直近開示したカードの要素を渡す（mobile）", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <HintList
        hints={mockHints}
        visibleCount={1}
        animateReveal
        layout="mobile"
        justRevealedRef={ref}
      />,
    );

    expect(ref.current).not.toBeNull();
    expect(ref.current?.textContent).toContain("VAL_1");
  });
});
