// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import HaloRingGauge from "./HaloRingGauge";

describe("HaloRingGauge - アクセシビリティ", () => {
  it("labelが無くてもchildrenのテキストは読み取れる", () => {
    render(
      <HaloRingGauge value={0.5}>
        <span>SS</span>
      </HaloRingGauge>,
    );

    expect(screen.getByText("SS")).toBeTruthy();
  });

  it("labelがあるときはコンテナにrole=imgとaria-labelが付く", () => {
    render(<HaloRingGauge value={0.5} label="残りヒント 3" />);

    const img = screen.getByRole("img", { name: "残りヒント 3" });
    expect(img).toBeTruthy();
  });
});
