// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Button from "./Button";

describe("Button - フォーカス枠", () => {
  it("accent は紺の枠で、白いすき間を空ける", () => {
    render(<Button variant="accent">確定</Button>);
    const { classList } = screen.getByRole("button", { name: "確定" });

    expect(classList.contains("focus-visible:ring-ba-navy")).toBe(true);
    expect(classList.contains("focus-visible:ring-offset-2")).toBe(true);
    expect(classList.contains("focus-visible:ring-offset-white")).toBe(true);
    expect(classList.contains("focus-visible:ring-ba-blue")).toBe(false);
  });

  it.each(["primary", "secondary"] as const)("%s は青い枠のまま", (variant) => {
    render(<Button variant={variant}>操作</Button>);
    const { classList } = screen.getByRole("button", { name: "操作" });

    expect(classList.contains("focus-visible:ring-ba-blue")).toBe(true);
    expect(classList.contains("focus-visible:ring-offset-1")).toBe(true);
    expect(classList.contains("focus-visible:ring-ba-navy")).toBe(false);
  });
});
