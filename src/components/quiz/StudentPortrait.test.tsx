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
  it("「全身を見る」ボタンで開き、閉じるボタンで閉じる", () => {
    const student = makeStudent("s1", "生徒A");
    render(<StudentPortrait student={student} state="revealed" correct />);

    fireEvent.click(screen.getByRole("button", { name: "全身を見る" }));
    expect(screen.getByRole("dialog")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "閉じる" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("stateがhiddenの間はモーダルを描画しない", () => {
    const student = makeStudent("s1", "生徒A");
    const { rerender } = render(<StudentPortrait student={student} state="revealed" correct />);

    fireEvent.click(screen.getByRole("button", { name: "全身を見る" }));
    expect(screen.getByRole("dialog")).toBeTruthy();

    rerender(<StudentPortrait student={student} state="hidden" correct />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
