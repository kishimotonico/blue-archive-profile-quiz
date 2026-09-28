// @vitest-environment jsdom
import { createRef } from "react";
import { render, screen, waitFor } from "@testing-library/react";
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
      containerRef={containerRef}
    />,
  );
  return { ...utils, containerRef };
}

describe("MobilePortraitCard - hiddenの間の表示", () => {
  it("stateがhiddenのときは立ち絵を描画せず、「？」の枠を描画する", () => {
    renderCard("hidden");
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("?")).not.toBeNull();
  });

  it("stateがhiddenのときは枠の高さを固定値（最低7rem、縦長画面で25dvh）にする", () => {
    const { containerRef } = renderCard("hidden");
    expect(containerRef.current?.className).toContain("h-[max(7rem,25dvh)]");
  });

  it("「シルエット」ラベルを表示する", () => {
    renderCard("hidden");
    expect(screen.getByText("シルエット")).not.toBeNull();
  });

  it("HintCardの未開示面と同じ枠なし・薄い面にする", () => {
    const { containerRef } = renderCard("hidden");
    expect(containerRef.current?.className).toContain("border-transparent");
    expect(containerRef.current?.className).toContain("bg-ba-sky-1/60");
  });
});

describe("MobilePortraitCard - 展開後の見た目", () => {
  it("白地・border-ba-borderに切り替わる", () => {
    const { containerRef } = renderCard("silhouette");
    expect(containerRef.current?.className).toContain("border-ba-border");
    expect(containerRef.current?.className).toContain("bg-white");
  });

  it("枠全体が見える状態のclip-pathを指定する", () => {
    const { containerRef } = renderCard("silhouette");
    expect(containerRef.current?.className).toContain("[clip-path:inset(0_round_1rem)]");
  });

  it("枠の高さの上限を固定値（60dvhと画面残りの小さい方）にする", () => {
    const { containerRef } = renderCard("silhouette");
    expect(containerRef.current?.className).toContain("h-[min(60dvh,calc(100dvh_-_20rem))]");
  });
});

describe("MobilePortraitCard - 「シルエット」ラベル", () => {
  it("展開後（silhouette）はラベルを不透明度0にする", () => {
    renderCard("silhouette");
    const label = screen.getByText("シルエット");
    expect(label.className).toContain("opacity-0");
  });
});

describe("MobilePortraitCard - 広がる演出（ba-portrait-grow）", () => {
  it("hiddenから展開へ遷移したときは広がる演出のクラスを付ける", () => {
    const { rerender, containerRef } = renderCard("hidden");
    rerender(
      <MobilePortraitCard
        student={mockStudent}
        portraitState="silhouette"
        containerRef={containerRef}
      />,
    );
    expect(containerRef.current?.className).toContain("ba-portrait-grow");
  });

  it("最初から展開済み（復元）で描画されたときは広がる演出のクラスを付けない", () => {
    const { containerRef } = renderCard("revealed");
    expect(containerRef.current?.className).not.toContain("ba-portrait-grow");
  });

  it("hidden中は広がる演出のクラスを付けない", () => {
    const { containerRef } = renderCard("hidden");
    expect(containerRef.current?.className).not.toContain("ba-portrait-grow");
  });
});

describe("MobilePortraitCard - 操作エリアとの隙間・広がる演出の開始値（固定CSS値）", () => {
  it("枠の下端と操作エリアの隙間をscroll-margin-bottomの固定値で表す", () => {
    const { containerRef } = renderCard("silhouette");
    expect(containerRef.current?.className).toContain("[scroll-margin-bottom:1rem]");
  });

  it("ba-portrait-grow（index.css）のクリップ開始値をhidden中の高さと同じ固定値で渡す", () => {
    const { containerRef } = renderCard("silhouette");
    expect(containerRef.current?.className).toContain(
      "[--portrait-compact-height:max(7rem,25dvh)]",
    );
  });
});

describe("MobilePortraitCard - シルエットの表示", () => {
  it("最初から silhouette で描画されたとき（復元）は、フェードインを待たずに見える", () => {
    renderCard("silhouette");
    expect(screen.getByRole("img").className).toContain("opacity-50");
  });

  it("hidden → silhouette ではフェードインして見える", async () => {
    const { rerender, containerRef } = renderCard("hidden");
    rerender(
      <MobilePortraitCard
        student={mockStudent}
        portraitState="silhouette"
        containerRef={containerRef}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole("img").className).toContain("opacity-50");
    });
  });
});
