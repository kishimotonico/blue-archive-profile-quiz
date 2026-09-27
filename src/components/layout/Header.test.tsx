// @vitest-environment jsdom
import { render, screen, fireEvent, within } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import Header from "./Header";
import type { DailyHistory } from "../../store/daily";
import { dailyHistoryAtom } from "../../store/daily";

const { TODAY } = vi.hoisted(() => ({ TODAY: "2026-04-21" }));

vi.mock("../../quiz-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../quiz-core")>();
  return {
    ...actual,
    getDailyDate: vi.fn().mockReturnValue(TODAY),
    getTimeUntilNextReset: vi.fn().mockReturnValue({ hours: 3, minutes: 15 }),
  };
});

function renderHeader(path: string, store: ReturnType<typeof createStore> = createStore()) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Provider store={store}>
        <Header />
      </Provider>
    </MemoryRouter>,
  );
  // md未満のモバイルパネル。jsdomではTailwindのhiddenが実CSSとして効かないため、
  // デスクトップナビ側の同名リンクと混ざらないようパネル内だけを対象にする
  return within(document.getElementById("mobile-menu") as HTMLElement);
}

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "メニュー" }));
}

describe("Header のモバイルメニュー", () => {
  it("ハンバーガーで開閉でき、閉じている間はinert", () => {
    renderHeader("/");
    const panel = document.getElementById("mobile-menu");
    expect(panel?.hasAttribute("inert")).toBe(true);

    openMenu();
    expect(panel?.hasAttribute("inert")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "メニュー" }));
    expect(panel?.hasAttribute("inert")).toBe(true);
  });

  it("Escapeで閉じる", () => {
    renderHeader("/");
    openMenu();
    const panel = document.getElementById("mobile-menu");
    expect(panel?.hasAttribute("inert")).toBe(false);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(panel?.hasAttribute("inert")).toBe(true);
  });

  it("/ では日替わりタイルにaria-current='page'が付く", () => {
    const panel = renderHeader("/");
    openMenu();
    expect(panel.getByRole("link", { name: /日替わり/ }).getAttribute("aria-current")).toBe(
      "page",
    );
    expect(panel.getByRole("link", { name: /フリープレイ/ }).getAttribute("aria-current")).toBe(
      null,
    );
  });

  it("/regular ではフリープレイタイルにaria-current='page'が付く", () => {
    const panel = renderHeader("/regular");
    openMenu();
    expect(panel.getByRole("link", { name: /フリープレイ/ }).getAttribute("aria-current")).toBe(
      "page",
    );
    expect(panel.getByRole("link", { name: /日替わり/ }).getAttribute("aria-current")).toBe(null);
  });

  it("今日の日替わりが未回答なら未回答の文言が出る", () => {
    const panel = renderHeader("/");
    openMenu();
    expect(panel.getByText("今日の日替わりはまだ回答していません")).toBeTruthy();
    expect(panel.getByText(/次の問題まで 3時間15分後/)).toBeTruthy();
  });

  it("今日の日替わりが回答済みなら点数が出る", () => {
    const history: DailyHistory = {
      schemaVersion: 1,
      records: [
        {
          key: { version: 1, baseDate: TODAY, seed: 20260421 },
          result: { studentId: "s1", usedHintCount: 3, correct: true, userAnswer: "s1", score: 8 },
          playedAt: 1234567890,
        },
      ],
    };
    const store = createStore();
    store.set(dailyHistoryAtom, history);

    const panel = renderHeader("/", store);
    openMenu();

    expect(panel.getByText("今日の日替わり 8点")).toBeTruthy();
  });

  it("GitHubへのリンクが新しいタブで開く設定で存在する", () => {
    const panel = renderHeader("/");
    openMenu();
    const link = panel.getByRole("link", { name: /GitHub/ });
    expect(link.getAttribute("href")).toBe(
      "https://github.com/kishimotonico/blue-archive-profile-quiz",
    );
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });
});
