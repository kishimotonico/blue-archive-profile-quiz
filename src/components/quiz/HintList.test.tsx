// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
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

const manyHints: Hint[] = [
  { type: "school", label: "学園", value: "VAL_1" },
  { type: "club", label: "部活", value: "VAL_2" },
  { type: "age", label: "年齢", value: "VAL_3" },
  { type: "birthday", label: "誕生日", value: "VAL_4" },
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

describe("HintList - 「残り n ヒント」の帯", () => {
  it("layout=desktop では帯を表示しない", () => {
    render(
      <HintList
        hints={manyHints}
        revealedCount={1}
        student={mockStudent}
        portraitState="hidden"
        layout="desktop"
      />,
    );

    expect(screen.queryByText(/残り/)).toBeNull();
  });

  it("layout=mobile かつ残り2枚以上では帯を表示する", () => {
    render(
      <HintList
        hints={manyHints}
        revealedCount={1}
        student={mockStudent}
        portraitState="hidden"
        layout="mobile"
      />,
    );

    expect(screen.getByText(/残り 3 ヒント/)).toBeTruthy();
  });
});
