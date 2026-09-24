// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import StudentPortrait from "./StudentPortrait";
import type { Student } from "../../quiz-core";

vi.mock("./portraitImageUrl", () => ({
  getPortraitImageUrl: vi.fn().mockReturnValue("about:blank"),
  NO_IMAGE_URL: "about:blank",
}));

function makeStudent(id: string, fullName: string): Student {
  return {
    id,
    fullName,
    name: fullName,
    school: "テスト学園",
    grade: "1年生",
    club: "テスト部",
    age: "15歳",
    birthday: "1月1日",
    height: "160cm",
    hobby: "テスト",
    weaponName: "テスト銃",
    cv: "テストCV",
    portraitImage: `images/${id}.png`,
    availableFrom: "2026-04-21",
    skills: { ex: "", normal: "", passive: "", sub: "" },
  };
}

describe("StudentPortrait - 全身を見るモーダル", () => {
  it("生徒が変わると開いていた全身モーダルが閉じる", () => {
    const studentA = makeStudent("s1", "生徒A");
    const { rerender } = render(<StudentPortrait student={studentA} state="revealed" />);

    fireEvent.click(screen.getByRole("button", { name: "全身を見る" }));
    expect(screen.getByRole("dialog")).toBeTruthy();

    const studentB = makeStudent("s2", "生徒B");
    rerender(<StudentPortrait student={studentB} state="hidden" />);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("stateがhiddenの間はモーダルを描画しない", () => {
    const student = makeStudent("s1", "生徒A");
    const { rerender } = render(<StudentPortrait student={student} state="revealed" />);

    fireEvent.click(screen.getByRole("button", { name: "全身を見る" }));
    expect(screen.getByRole("dialog")).toBeTruthy();

    rerender(<StudentPortrait student={student} state="hidden" />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
