// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
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
  return render(<MobilePortraitCard student={mockStudent} portraitState={portraitState} />);
}

describe("MobilePortraitCard - hiddenの間は描画しない", () => {
  it("stateがhiddenのときは何も描画しない", () => {
    renderCard("hidden");
    expect(screen.queryByRole("img")).toBeNull();
  });
});

describe("MobilePortraitCard - 立ち絵表示時の自動スクロール", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("hidden → silhouette で立ち絵へスクロールする", () => {
    const { rerender } = renderCard("hidden");
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();

    rerender(<MobilePortraitCard student={mockStudent} portraitState="silhouette" />);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("silhouette → revealed でも立ち絵へスクロールする", () => {
    const { rerender } = renderCard("silhouette");
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();

    rerender(<MobilePortraitCard student={mockStudent} portraitState="revealed" />);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("hidden → revealed（シルエットを経由せず正解した場合）でも立ち絵へスクロールする", () => {
    const { rerender } = renderCard("hidden");
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();

    rerender(<MobilePortraitCard student={mockStudent} portraitState="revealed" />);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("revealed のまま再レンダリングされても重複してスクロールしない", () => {
    const { rerender } = renderCard("revealed");

    rerender(<MobilePortraitCard student={mockStudent} portraitState="revealed" />);

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});

describe("MobilePortraitCard - シルエットの表示", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("最初から silhouette で描画されたとき（復元）は、フェードインを待たずに見える", () => {
    renderCard("silhouette");
    expect(screen.getByRole("img").className).toContain("opacity-50");
  });

  it("hidden → silhouette ではフェードインして見える", async () => {
    const { rerender } = renderCard("hidden");
    rerender(<MobilePortraitCard student={mockStudent} portraitState="silhouette" />);
    await waitFor(() => {
      expect(screen.getByRole("img").className).toContain("opacity-50");
    });
  });
});
