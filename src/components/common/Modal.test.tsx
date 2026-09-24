// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
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

describe("Modal - 開閉", () => {
  function Harness() {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setIsOpen(true)}>
          開くボタン
        </button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="タイトル">
          <button type="button">中身のボタン</button>
        </Modal>
      </>
    );
  }

  it("isOpenがtrueになるとdialogが開き、falseになると閉じる", () => {
    const { rerender } = render(
      <Modal isOpen={false} onClose={() => {}} ariaLabel="ラベル">
        <p>内容</p>
      </Modal>,
    );

    expect(screen.queryByRole("dialog")).toBeNull();

    rerender(
      <Modal isOpen onClose={() => {}} ariaLabel="ラベル">
        <p>内容</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("閉じるボタンでonCloseが呼ばれる", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "開くボタン" }));
    expect(screen.getByRole("dialog")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "閉じる" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("背景（dialog自身）のクリックでonCloseが呼ばれる", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "開くボタン" }));

    fireEvent.click(screen.getByRole("dialog"));

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("中身のクリックでは閉じない", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "開くボタン" }));

    fireEvent.click(screen.getByRole("button", { name: "中身のボタン" }));

    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("closeイベント（Escapeなどネイティブの close 経路）でonCloseが呼ばれる", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} ariaLabel="ラベル">
        <p>内容</p>
      </Modal>,
    );

    fireEvent(screen.getByRole("dialog"), new Event("close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
