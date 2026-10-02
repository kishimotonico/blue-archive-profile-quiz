// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Button from "./Button";

describe("Button - type", () => {
  it("既定は button（form 内で意図せず submit しない）", () => {
    render(<Button>操作</Button>);

    expect(screen.getByRole("button", { name: "操作" }).getAttribute("type")).toBe("button");
  });

  it("type=submit を渡せば submit になる", () => {
    render(<Button type="submit">送信</Button>);

    expect(screen.getByRole("button", { name: "送信" }).getAttribute("type")).toBe("submit");
  });
});
