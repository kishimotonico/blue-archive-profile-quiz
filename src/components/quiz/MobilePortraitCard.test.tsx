// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MobilePortraitCard, { expandedHeightStyle } from "./MobilePortraitCard";
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

// 高さ未測定（0）を既定にする。centerフォールバックの挙動を検証するテストで使う
function renderCard(portraitState: PortraitState, answeredOperationAreaHeight = 0) {
  return render(
    <MobilePortraitCard
      student={mockStudent}
      portraitState={portraitState}
      answeredOperationAreaHeight={answeredOperationAreaHeight}
      compactHeight={112}
      expandedMaxHeight={600}
    />,
  );
}

// MobileQuizLayout側の実際のDOM構造（.overflow-y-autoの祖先と、操作エリアを示す
// [data-quiz-footer-area]）を再現し、回答後の高さを見込んだ位置決め（scrollBy）を
// 検証できるようにする
function ScrollAreaWrapper({
  portraitState,
  answeredOperationAreaHeight,
}: {
  portraitState: PortraitState;
  answeredOperationAreaHeight: number;
}) {
  return (
    <div className="overflow-y-auto">
      <MobilePortraitCard
        student={mockStudent}
        portraitState={portraitState}
        answeredOperationAreaHeight={answeredOperationAreaHeight}
        compactHeight={112}
        expandedMaxHeight={600}
      />
      <div data-quiz-footer-area />
    </div>
  );
}

function renderCardInScrollArea(portraitState: PortraitState, answeredOperationAreaHeight: number) {
  return render(
    <ScrollAreaWrapper
      portraitState={portraitState}
      answeredOperationAreaHeight={answeredOperationAreaHeight}
    />,
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

  it("stateがhiddenのときは枠の高さにcompactHeightを使う", () => {
    const { container } = render(
      <MobilePortraitCard
        student={mockStudent}
        portraitState="hidden"
        answeredOperationAreaHeight={0}
        compactHeight={240}
        expandedMaxHeight={600}
      />,
    );
    const portraitEl = container.querySelector("[data-portrait]") as HTMLElement;
    expect(portraitEl.style.height).toBe("240px");
  });

  it("「シルエット」ラベルを表示する", () => {
    renderCard("hidden");
    expect(screen.getByText("シルエット")).not.toBeNull();
  });

  it("HintCardの未開示面と同じ枠なし・薄い面にする", () => {
    const { container } = renderCard("hidden");
    const portraitEl = container.querySelector("[data-portrait]") as HTMLElement;
    expect(portraitEl.className).toContain("border-transparent");
    expect(portraitEl.className).toContain("bg-ba-sky-1/60");
  });
});

describe("MobilePortraitCard - 展開後の見た目", () => {
  it("白地・border-ba-borderに切り替わる", () => {
    const { container } = render(
      <MobilePortraitCard
        student={mockStudent}
        portraitState="silhouette"
        answeredOperationAreaHeight={0}
        compactHeight={112}
        expandedMaxHeight={600}
      />,
    );
    const portraitEl = container.querySelector("[data-portrait]") as HTMLElement;
    expect(portraitEl.className).toContain("border-ba-border");
    expect(portraitEl.className).toContain("bg-white");
  });
});

describe("MobilePortraitCard - 「シルエット」ラベル", () => {
  it("展開後（silhouette）はラベルを不透明度0にする", () => {
    render(
      <MobilePortraitCard
        student={mockStudent}
        portraitState="silhouette"
        answeredOperationAreaHeight={0}
        compactHeight={112}
        expandedMaxHeight={600}
      />,
    );
    const label = screen.getByText("シルエット");
    expect(label.className).toContain("opacity-0");
  });
});

// jsdomはCSSのmin()とdvh単位の組み合わせを解釈できず、style.heightに反映されない
// （実ブラウザでは問題なく評価される）ため、DOM描画からではなく値を組み立てる
// 純関数を直接検証する
describe("MobilePortraitCard - 展開後の枠の高さの上限（expandedHeightStyle）", () => {
  it("60dvhとexpandedMaxHeightの小さい方を採用できるよう、CSSのmin()に両方を渡す", () => {
    expect(expandedHeightStyle(320)).toBe("min(60dvh, 320px)");
    expect(expandedHeightStyle(600)).toBe("min(60dvh, 600px)");
  });
});

// jsdomのTransitionEventにはpropertyNameが無いため、実イベントに近づけて自作する
function makeTransitionEndEvent(propertyName: string): TransitionEvent {
  const event = new Event("transitionend") as TransitionEvent & { propertyName?: string };
  Object.defineProperty(event, "propertyName", { value: propertyName });
  return event;
}

describe("MobilePortraitCard - 高さ未測定時は広がりきったタイミングでcenterへ寄せる", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    mockPrefersReducedMotion(false);
  });

  it("hidden → silhouette では、枠のheight transitionendが起きるまでスクロールしない", () => {
    const { rerender, container } = renderCard("hidden");

    rerender(
      <MobilePortraitCard
        student={mockStudent}
        portraitState="silhouette"
        answeredOperationAreaHeight={0}
        compactHeight={112}
        expandedMaxHeight={600}
      />,
    );
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
    rerender(
      <MobilePortraitCard
        student={mockStudent}
        portraitState="silhouette"
        answeredOperationAreaHeight={0}
        compactHeight={112}
        expandedMaxHeight={600}
      />,
    );

    const portraitEl = container.querySelector("[data-portrait]") as HTMLElement;
    portraitEl.dispatchEvent(makeTransitionEndEvent("opacity"));

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("hidden → revealed（シルエットを経由せず正解した場合）でも、枠が広がりきってからスクロールする", () => {
    const { rerender, container } = renderCard("hidden");
    rerender(
      <MobilePortraitCard
        student={mockStudent}
        portraitState="revealed"
        answeredOperationAreaHeight={0}
        compactHeight={112}
        expandedMaxHeight={600}
      />,
    );
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();

    const portraitEl = container.querySelector("[data-portrait]") as HTMLElement;
    portraitEl.dispatchEvent(makeTransitionEndEvent("height"));

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("revealed のまま再レンダリングされてもスクロールしない", () => {
    const { rerender } = renderCard("revealed");

    rerender(
      <MobilePortraitCard
        student={mockStudent}
        portraitState="revealed"
        answeredOperationAreaHeight={0}
        compactHeight={112}
        expandedMaxHeight={600}
      />,
    );

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});

describe("MobilePortraitCard - 回答後の高さを見込んだ位置決め", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    Element.prototype.scrollBy = vi.fn();
    mockPrefersReducedMotion(false);
  });

  it("hidden → silhouette では、広がりきった時点で回答後の高さを見込んだ位置までscrollByする", () => {
    const answeredOperationAreaHeight = 200;
    const { rerender, container } = renderCardInScrollArea("hidden", answeredOperationAreaHeight);

    rerender(
      <ScrollAreaWrapper
        portraitState="silhouette"
        answeredOperationAreaHeight={answeredOperationAreaHeight}
      />,
    );

    const portraitEl = container.querySelector("[data-portrait]") as HTMLElement;
    portraitEl.dispatchEvent(makeTransitionEndEvent("height"));

    // jsdomではレイアウトが無くgetBoundingClientRect().bottomは0を返すが、
    // window.innerHeightはjsdomの既定値（768）を返すため、同じ式で期待値を計算する
    // （実装と同じ計算式であることの確認）。
    // desiredBottom = window.innerHeight - MAIN_BOTTOM_PADDING(16) - answeredOperationAreaHeight - MIN_BOTTOM_GAP(20)
    const desiredBottom = window.innerHeight - 16 - answeredOperationAreaHeight - 20;
    const expectedDelta = 0 - desiredBottom;
    expect(Element.prototype.scrollBy).toHaveBeenCalledTimes(1);
    expect(Element.prototype.scrollBy).toHaveBeenCalledWith({
      top: expectedDelta,
      behavior: "smooth",
    });
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("hidden → revealed直行でも同じ基準で1回だけ位置を決める", () => {
    const answeredOperationAreaHeight = 150;
    const { rerender, container } = renderCardInScrollArea("hidden", answeredOperationAreaHeight);

    rerender(
      <ScrollAreaWrapper
        portraitState="revealed"
        answeredOperationAreaHeight={answeredOperationAreaHeight}
      />,
    );
    const portraitEl = container.querySelector("[data-portrait]") as HTMLElement;
    portraitEl.dispatchEvent(makeTransitionEndEvent("height"));

    expect(Element.prototype.scrollBy).toHaveBeenCalledTimes(1);
  });

  it("silhouette → revealed（答え合わせ）では位置を決め直さない", () => {
    const answeredOperationAreaHeight = 200;
    const { rerender } = renderCardInScrollArea("silhouette", answeredOperationAreaHeight);

    rerender(
      <ScrollAreaWrapper
        portraitState="revealed"
        answeredOperationAreaHeight={answeredOperationAreaHeight}
      />,
    );

    expect(Element.prototype.scrollBy).not.toHaveBeenCalled();
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it(".overflow-y-autoの祖先が無ければcenterへフォールバックする", () => {
    const { rerender, container } = renderCard("hidden", 200);
    rerender(
      <MobilePortraitCard
        student={mockStudent}
        portraitState="silhouette"
        answeredOperationAreaHeight={200}
        compactHeight={112}
        expandedMaxHeight={600}
      />,
    );

    const portraitEl = container.querySelector("[data-portrait]") as HTMLElement;
    portraitEl.dispatchEvent(makeTransitionEndEvent("height"));

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
    expect(Element.prototype.scrollBy).not.toHaveBeenCalled();
  });
});

describe("MobilePortraitCard - prefers-reduced-motionでの自動スクロール", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    mockPrefersReducedMotion(true);
  });

  it("hidden → silhouette で、transitionendを待たず即座にスクロールする", () => {
    const { rerender } = renderCard("hidden");

    rerender(
      <MobilePortraitCard
        student={mockStudent}
        portraitState="silhouette"
        answeredOperationAreaHeight={0}
        compactHeight={112}
        expandedMaxHeight={600}
      />,
    );

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
    rerender(
      <MobilePortraitCard
        student={mockStudent}
        portraitState="silhouette"
        answeredOperationAreaHeight={0}
        compactHeight={112}
        expandedMaxHeight={600}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole("img").className).toContain("opacity-50");
    });
  });
});
