import { describe, it, expect } from "vitest";
import { extractFamilyName } from "./students";

describe("extractFamilyName", () => {
  it("陸八魔アル → 陸八魔", () => {
    expect(extractFamilyName("陸八魔アル")).toBe("陸八魔");
  });

  it("浅黄ムツキ → 浅黄", () => {
    expect(extractFamilyName("浅黄ムツキ")).toBe("浅黄");
  });

  it("天雨アメ → 天雨", () => {
    expect(extractFamilyName("天雨アメ")).toBe("天雨");
  });

  it("姓のみカタカナ（ホシノ）はフルネームをそのまま返す", () => {
    expect(extractFamilyName("ホシノ")).toBe("ホシノ");
  });

  it("長音符(ー)を含むカタカナ名", () => {
    // 例: "二見ヴィオラ" など ヴ はカタカナ範囲内
    expect(extractFamilyName("二見ヴィオラ")).toBe("二見");
  });
});
