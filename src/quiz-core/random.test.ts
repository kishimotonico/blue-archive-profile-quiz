import { describe, it, expect } from "vitest";
import { seededRandomV1, shuffleV1, deriveSeedV1 } from "./random";

describe("seededRandomV1", () => {
  it("同じseedで同じ数列が生成される（再現性）", () => {
    const rng1 = seededRandomV1(12345);
    const rng2 = seededRandomV1(12345);

    for (let i = 0; i < 10; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it("生成される値が0〜1の範囲に収まる", () => {
    const rng = seededRandomV1(42);
    for (let i = 0; i < 100; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it("異なるseedでは異なる数列が生成される", () => {
    const rng1 = seededRandomV1(1);
    const rng2 = seededRandomV1(2);
    const seq1 = Array.from({ length: 5 }, () => rng1());
    const seq2 = Array.from({ length: 5 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });
});

describe("shuffleV1", () => {
  it("配列の要素がすべて保持される", () => {
    const original = [1, 2, 3, 4, 5];
    const copy = shuffleV1([...original], 42);
    expect(copy).toHaveLength(original.length);
    expect([...copy].sort()).toEqual([...original].sort());
  });

  it("同じseedで決定論的な結果を返す", () => {
    const arr1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const arr2 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    expect(shuffleV1(arr1, 999)).toEqual(shuffleV1(arr2, 999));
  });

  it("空配列でも動作する", () => {
    expect(shuffleV1([], 1)).toEqual([]);
  });

  it("1要素の配列はそのまま返す", () => {
    expect(shuffleV1([42], 1)).toEqual([42]);
  });
});

describe("deriveSeedV1", () => {
  it("同じ引数で同じ値を返す（再現性）", () => {
    expect(deriveSeedV1(100, "hints")).toBe(deriveSeedV1(100, "hints"));
  });

  it("tagが異なれば異なる値を返す（ドメイン分離）", () => {
    expect(deriveSeedV1(100, "hints")).not.toBe(deriveSeedV1(100, "pick"));
  });

  it("indexが異なれば異なる値を返す", () => {
    expect(deriveSeedV1(100, "q", 0)).not.toBe(deriveSeedV1(100, "q", 1));
  });

  it("非負整数を返す", () => {
    for (let i = 0; i < 20; i++) {
      expect(deriveSeedV1(i * 1234567, "test", i)).toBeGreaterThanOrEqual(0);
    }
  });
});
