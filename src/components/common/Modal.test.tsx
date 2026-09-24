// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { useRef, useState } from "react";
import { describe, it, expect } from "vitest";
import Modal from "./Modal";

describe("Modal - アクセシブルネーム", () => {
  it("titleが無いときはariaLabelがrole=dialogのアクセシブルネームになる", () => {
    render(
      <Modal isOpen onClose={() => {}} ariaLabel="今日のクイズの結果">
        <p>内容</p>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-label")).toBe("今日のクイズの結果");
  });
});

describe("Modal - フォーカスの退避・復帰", () => {
  it("onCloseの参照が変わる再レンダリングだけではフォーカスの退避・復帰を再実行しない", () => {
    function Harness() {
      const [, forceRerender] = useState(0);
      return (
        <>
          <button type="button">外側のボタン</button>
          {/* 毎回新しい関数を渡すことで、依存配列に onClose を含めた場合の
              退避・復帰の再実行を検出できるようにする */}
          <Modal isOpen onClose={() => {}}>
            <button type="button" onClick={() => forceRerender((n) => n + 1)}>
              再レンダリングを起こす
            </button>
          </Modal>
        </>
      );
    }

    render(<Harness />);
    const closeButton = screen.getByRole("button", { name: "閉じる" });
    expect(document.activeElement).toBe(closeButton);

    // モーダル内の別要素にフォーカスを移してから、onCloseの参照が変わる再レンダリングを起こす
    const rerenderButton = screen.getByRole("button", { name: "再レンダリングを起こす" });
    rerenderButton.focus();
    fireEvent.click(rerenderButton);

    // 退避・復帰effectが再実行されていれば、closeButtonへフォーカスが戻ってしまう
    expect(document.activeElement).toBe(rerenderButton);
  });

  it("復帰先が無いとき（activeElementがbody）はfocusFallbackRefへフォーカスする", () => {
    function Harness() {
      const fallbackRef = useRef<HTMLButtonElement>(null);
      const [isOpen, setIsOpen] = useState(true);
      return (
        <>
          <button ref={fallbackRef} type="button">
            結果を見る
          </button>
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} focusFallbackRef={fallbackRef}>
            <p>内容</p>
          </Modal>
        </>
      );
    }

    render(<Harness />);
    (document.activeElement as HTMLElement | null)?.blur();
    expect(document.activeElement === document.body || document.activeElement === null).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "閉じる" }));

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "結果を見る" }));
  });

  it("ボタン経由で開いたときは、閉じるとそのボタンにフォーカスが戻る", () => {
    function Harness() {
      const fallbackRef = useRef<HTMLButtonElement>(null);
      const [isOpen, setIsOpen] = useState(false);
      return (
        <>
          <button ref={fallbackRef} type="button">
            結果を見る
          </button>
          <button type="button" onClick={() => setIsOpen(true)}>
            開くボタン
          </button>
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} focusFallbackRef={fallbackRef}>
            <p>内容</p>
          </Modal>
        </>
      );
    }

    render(<Harness />);
    const openButton = screen.getByRole("button", { name: "開くボタン" });
    // fireEvent.clickはjsdom上ではフォーカス移動を伴わないため、実際のクリックを模して明示的にfocusする
    openButton.focus();
    fireEvent.click(openButton);
    fireEvent.click(screen.getByRole("button", { name: "閉じる" }));

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "開くボタン" }));
  });
});
