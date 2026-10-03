// @vitest-environment jsdom
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MobilePortraitCard from "./MobilePortraitCard";
import type { PortraitState, Student } from "../../quiz-core";

vi.mock("./portraitImageUrl", () => ({
  getPortraitImageUrl: vi.fn().mockReturnValue("about:blank"),
  NO_IMAGE_URL: "about:blank",
}));

const mockStudent: Student = {
  id: "s1",
  fullName: "テスト 太郎",
  name: "タロウ",
  school: "テスト学園",
  grade: "1年生",
  club: "テスト部",
  age: "15歳",
  birthday: "1月1日",
  height: "160cm",
  hobby: "テスト",
  weaponName: "テスト銃",
  cv: "テストCV",
  portraitImage: "images/s1.png",
  availableFrom: "2026-04-21",
  skills: { ex: "", normal: "", passive: "", sub: "" },
};

function renderCard(portraitState: PortraitState) {
  const containerRef = createRef<HTMLDivElement>();
  const utils = render(
    <MobilePortraitCard
      student={mockStudent}
      portraitState={portraitState}
      correct={false}
      containerRef={containerRef}
    />,
  );
  return { ...utils, containerRef };
}

describe("MobilePortraitCard", () => {
  it("hidden のときは立ち絵を描画せず、「?」と「シルエット」のラベルを出す", () => {
    renderCard("hidden");
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("?")).not.toBeNull();
    expect(screen.getByText("シルエット")).not.toBeNull();
  });

  it("silhouette のときは alt「シルエット」の立ち絵を描画し、「?」は出さない", () => {
    renderCard("silhouette");
    expect(screen.getByRole("img", { name: "シルエット" })).not.toBeNull();
    expect(screen.queryByText("?")).toBeNull();
  });

  it("revealed のときは生徒名を alt にした立ち絵を描画する", () => {
    renderCard("revealed");
    expect(screen.getByRole("img", { name: mockStudent.fullName })).not.toBeNull();
  });

  it("revealed のとき、正解なら「正解」、そうでなければ「答え」のバッジを出す", () => {
    const containerRef = createRef<HTMLDivElement>();
    const { rerender } = render(
      <MobilePortraitCard
        student={mockStudent}
        portraitState="revealed"
        correct
        containerRef={containerRef}
      />,
    );
    expect(screen.getByText("正解")).not.toBeNull();

    rerender(
      <MobilePortraitCard
        student={mockStudent}
        portraitState="revealed"
        correct={false}
        containerRef={containerRef}
      />,
    );
    expect(screen.getByText("答え")).not.toBeNull();
  });

  it("silhouette ではバッジを出さない", () => {
    renderCard("silhouette");
    expect(screen.queryByText("正解")).toBeNull();
    expect(screen.queryByText("答え")).toBeNull();
  });

  it("containerRef が枠の要素を指す", () => {
    const { containerRef } = renderCard("hidden");
    expect(containerRef.current).toBeInstanceOf(HTMLDivElement);
  });
});
