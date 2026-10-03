// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import RankDistribution from "./RankDistribution";

const counts = { SS: 1, S: 3, A: 0, B: 2, C: 0, D: 0 };

describe("RankDistribution", () => {
  it("ランクごとに範囲と回数の読み上げテキストを出す", () => {
    render(<RankDistribution counts={counts} highlightRank={null} />);

    const items = screen.getByRole("list", { name: "ランク分布" }).querySelectorAll("li");
    expect(items).toHaveLength(6);
    expect(screen.getByText("SSランク 10点 1回")).toBeTruthy();
    expect(screen.getByText("Sランク 8-9点 3回")).toBeTruthy();
    expect(screen.getByText("Dランク 0点 0回")).toBeTruthy();
  });

  it("今日のランクの行にだけ「（今日）」が付く", () => {
    render(<RankDistribution counts={counts} highlightRank="S" />);

    expect(screen.getByText("Sランク 8-9点 3回（今日）")).toBeTruthy();
    expect(screen.getByText("SSランク 10点 1回")).toBeTruthy();
    expect(screen.getAllByText(/（今日）/)).toHaveLength(1);
  });

  it("全ランク0回でも描画できる", () => {
    const zero = { SS: 0, S: 0, A: 0, B: 0, C: 0, D: 0 };
    render(<RankDistribution counts={zero} highlightRank="D" />);

    expect(screen.getByText("Dランク 0点 0回（今日）")).toBeTruthy();
  });
});
