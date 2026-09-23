// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import HintList from "./HintList";
import type { Hint, Student, PortraitState } from "../../quiz-core";

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

const mockHints: Hint[] = [
  { type: "school", label: "学園", value: "VAL_1" },
  { type: "club", label: "部活", value: "VAL_2" },
];

function renderHintList(portraitState: PortraitState) {
  return render(
    <HintList
      hints={mockHints}
      revealedCount={mockHints.length}
      student={mockStudent}
      portraitState={portraitState}
      layout="mobile"
    />,
  );
}

describe("HintList - 立ち絵表示時の自動スクロール", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("hidden → silhouette で立ち絵へスクロールする", () => {
    const { rerender } = renderHintList("hidden");
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();

    rerender(
      <HintList
        hints={mockHints}
        revealedCount={mockHints.length}
        student={mockStudent}
        portraitState="silhouette"
        layout="mobile"
      />,
    );

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("silhouette → revealed でも立ち絵へスクロールする", () => {
    const { rerender } = renderHintList("silhouette");
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();

    rerender(
      <HintList
        hints={mockHints}
        revealedCount={mockHints.length}
        student={mockStudent}
        portraitState="revealed"
        layout="mobile"
      />,
    );

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("hidden → revealed（シルエットを経由せず正解した場合）でも立ち絵へスクロールする", () => {
    const { rerender } = renderHintList("hidden");
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();

    rerender(
      <HintList
        hints={mockHints}
        revealedCount={mockHints.length}
        student={mockStudent}
        portraitState="revealed"
        layout="mobile"
      />,
    );

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("revealed のまま再レンダリングされても重複してスクロールしない", () => {
    const { rerender } = renderHintList("revealed");

    rerender(
      <HintList
        hints={mockHints}
        revealedCount={mockHints.length}
        student={mockStudent}
        portraitState="revealed"
        layout="mobile"
      />,
    );

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});
