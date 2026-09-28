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

// MobileQuizLayout側の実際のDOM構造（.overflow-y-autoの祖先）を再現し、
// silhouette→revealedの見切れ補正（scrollBy）を検証できるようにする
function renderCardInScrollArea(portraitState: PortraitState) {
  return render(
    <div className="overflow-y-auto">
      <MobilePortraitCard student={mockStudent} portraitState={portraitState} />
    </div>,
  );
}

// 明示的にモックしない限り window.matchMedia が無い（jsdom既定）状態を再現するため、
// 各テストで元に戻す
const originalMatchMedia = window.matchMedia;

function mockPrefersReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches }) as unknown as typeof window.matchMedia;
}

describe("MobilePortraitCard - hiddenの間の表示", () => {
  beforeEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("stateがhiddenのときは立ち絵を描画せず、「？」の枠を描画する", () => {
    renderCard("hidden");
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("?")).not.toBeNull();
  });
});

// jsdomのTransitionEventにはpropertyNameが無いため、実イベントに近づけて自作する
function makeTransitionEndEvent(propertyName: string): TransitionEvent {
  const event = new Event("transitionend") as TransitionEvent & { propertyName?: string };
  Object.defineProperty(event, "propertyName", { value: propertyName });
  return event;
}

describe("MobilePortraitCard - 枠が広がるタイミングでの自動スクロール", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    mockPrefersReducedMotion(false);
  });

  it("hidden → silhouette では、枠のheight transitionendが起きるまでスクロールしない", () => {
    const { rerender, container } = renderCard("hidden");

    rerender(<MobilePortraitCard student={mockStudent} portraitState="silhouette" />);
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();

    const portraitEl = container.querySelector("[data-portrait]") as HTMLElement;
    portraitEl.dispatchEvent(makeTransitionEndEvent("height"));

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
  });

  it("height以外のtransitionendではスクロールしない", () => {
    const { rerender, container } = renderCard("hidden");
    rerender(<MobilePortraitCard student={mockStudent} portraitState="silhouette" />);

    const portraitEl = container.querySelector("[data-portrait]") as HTMLElement;
    portraitEl.dispatchEvent(makeTransitionEndEvent("opacity"));

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("hidden → revealed（シルエットを経由せず正解した場合）でも、枠が広がりきってからスクロールする", () => {
    const { rerender, container } = renderCard("hidden");
    rerender(<MobilePortraitCard student={mockStudent} portraitState="revealed" />);
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();

    const portraitEl = container.querySelector("[data-portrait]") as HTMLElement;
    portraitEl.dispatchEvent(makeTransitionEndEvent("height"));

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("silhouette → revealed では枠は広がらないが、最小余白を割り込んだ分だけscrollByで補正する", () => {
    Element.prototype.scrollBy = vi.fn();
    const { rerender } = renderCardInScrollArea("silhouette");

    rerender(
      <div className="overflow-y-auto">
        <MobilePortraitCard student={mockStudent} portraitState="revealed" />
      </div>,
    );

    // jsdomではレイアウトが無くgetBoundingClientRectが全て0を返すため、
    // 最小余白（16px）分だけ常に不足として補正される
    expect(Element.prototype.scrollBy).toHaveBeenCalledTimes(1);
    expect(Element.prototype.scrollBy).toHaveBeenCalledWith({ top: 16, behavior: "smooth" });
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("silhouette → revealed で祖先に.overflow-y-autoが無ければ何もしない", () => {
    Element.prototype.scrollBy = vi.fn();
    const { rerender } = renderCard("silhouette");

    rerender(<MobilePortraitCard student={mockStudent} portraitState="revealed" />);

    expect(Element.prototype.scrollBy).not.toHaveBeenCalled();
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("revealed のまま再レンダリングされてもスクロールしない", () => {
    const { rerender } = renderCard("revealed");

    rerender(<MobilePortraitCard student={mockStudent} portraitState="revealed" />);

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});

describe("MobilePortraitCard - prefers-reduced-motionでの自動スクロール", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    mockPrefersReducedMotion(true);
  });

  it("hidden → silhouette で、transitionendを待たず即座にスクロールする", () => {
    const { rerender } = renderCard("hidden");

    rerender(<MobilePortraitCard student={mockStudent} portraitState="silhouette" />);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "center",
    });
  });
});

describe("MobilePortraitCard - シルエットの表示", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    mockPrefersReducedMotion(true);
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
