// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { registerDialogOpen, useIsAnyDialogOpen } from "./dialogRegistry";
import { renderHook, act } from "@testing-library/react";

describe("dialogRegistry", () => {
  it("2つ開いて1つ閉じてもopen扱いのまま、両方閉じるとclosed扱いになる", () => {
    const { result } = renderHook(() => useIsAnyDialogOpen());
    expect(result.current).toBe(false);

    let releaseFirst: () => void;
    let releaseSecond: () => void;
    act(() => {
      releaseFirst = registerDialogOpen();
    });
    expect(result.current).toBe(true);

    act(() => {
      releaseSecond = registerDialogOpen();
    });
    expect(result.current).toBe(true);

    act(() => {
      releaseFirst();
    });
    expect(result.current).toBe(true);

    act(() => {
      releaseSecond();
    });
    expect(result.current).toBe(false);
  });

  it("同じ解除関数を2回呼んでもカウントが余分に減らない", () => {
    const { result } = renderHook(() => useIsAnyDialogOpen());

    let release: () => void;
    act(() => {
      release = registerDialogOpen();
    });
    act(() => {
      release();
      release();
    });

    expect(result.current).toBe(false);
  });
});
