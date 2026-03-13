import { describe, it, expect } from "vitest";
import { seededRandom, shuffle } from "./random";

describe("seededRandom", () => {
  it("同じseedで同じ数列が生成される（再現性）", () => {
    const rng1 = seededRandom(12345);
    const rng2 = seededRandom(12345);

    for (let i = 0; i < 10; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it("生成される値が0〜1の範囲に収まる", () => {
    const rng = seededRandom(42);
    for (let i = 0; i < 100; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it("異なるseedでは異なる数列が生成される", () => {
    const rng1 = seededRandom(1);
    const rng2 = seededRandom(2);
    const seq1 = Array.from({ length: 5 }, () => rng1());
    const seq2 = Array.from({ length: 5 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });
});

describe("shuffle", () => {
  it("配列の要素がすべて保持される", () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    shuffle(copy);
    expect(copy).toHaveLength(original.length);
    expect(copy.sort()).toEqual(original.sort());
  });

  it("seedあり時に決定論的な結果を返す", () => {
    const arr1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const arr2 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const rng1 = seededRandom(999);
    const rng2 = seededRandom(999);
    shuffle(arr1, rng1);
    shuffle(arr2, rng2);
    expect(arr1).toEqual(arr2);
  });

  it("空配列でも動作する", () => {
    const arr: number[] = [];
    expect(shuffle(arr)).toEqual([]);
  });

  it("1要素の配列はそのまま返す", () => {
    const arr = [42];
    expect(shuffle(arr)).toEqual([42]);
  });
});
