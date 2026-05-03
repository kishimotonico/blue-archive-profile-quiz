import { describe, it, expect, vi, afterEach } from "vitest";
import { dateToSeed, getDailyDate, getDailyQuizKey, getNextDailyResetTime, getNextQuizDate } from "./daily";
import { CURRENT_ALGORITHM_VERSION } from "./key";

afterEach(() => {
  vi.useRealTimers();
});

describe("dateToSeed", () => {
  it("日付文字列を一意な数値に変換する", () => {
    expect(dateToSeed("2026-03-14")).toBe(20260314);
  });

  it("異なる日付は異なるseedになる", () => {
    expect(dateToSeed("2026-01-01")).not.toBe(dateToSeed("2026-01-02"));
  });

  it("年・月・日の差を正しく反映する", () => {
    expect(dateToSeed("2025-12-31")).toBe(20251231);
    expect(dateToSeed("2026-01-01")).toBe(20260101);
  });
});

describe("getDailyDate", () => {
  it("JST 4:00以降は当日の日付を返す", () => {
    // 2026-03-14 05:00 JST = 2026-03-13 20:00 UTC
    vi.setSystemTime(new Date("2026-03-13T20:00:00Z"));
    expect(getDailyDate()).toBe("2026-03-14");
  });

  it("JST 3:59は前日の日付を返す（境界）", () => {
    // 2026-03-14 03:59 JST = 2026-03-13 18:59 UTC
    vi.setSystemTime(new Date("2026-03-13T18:59:00Z"));
    expect(getDailyDate()).toBe("2026-03-13");
  });

  it("JST 4:00ちょうどは当日の日付を返す（境界）", () => {
    // 2026-03-14 04:00 JST = 2026-03-13 19:00 UTC
    vi.setSystemTime(new Date("2026-03-13T19:00:00Z"));
    expect(getDailyDate()).toBe("2026-03-14");
  });
});

describe("getDailyQuizKey", () => {
  it("getDailyDate() のseedと一致する", () => {
    vi.setSystemTime(new Date("2026-03-13T20:00:00Z"));
    const date = getDailyDate();
    const key = getDailyQuizKey();
    expect(key.seed).toBe(dateToSeed(date));
    expect(key.baseDate).toBe(date);
    expect(key.version).toBe(CURRENT_ALGORITHM_VERSION);
  });

  it("日付を渡すとその日のキーが生成される", () => {
    const key = getDailyQuizKey("2026-04-21");
    expect(key.baseDate).toBe("2026-04-21");
    expect(key.seed).toBe(dateToSeed("2026-04-21"));
  });
});

describe("getNextQuizDate", () => {
  it("翌クイズ日を返す", () => {
    expect(getNextQuizDate("2026-04-21")).toBe("2026-04-22");
  });

  it("月末を正しく越える", () => {
    expect(getNextQuizDate("2026-03-31")).toBe("2026-04-01");
  });

  it("年末を正しく越える", () => {
    expect(getNextQuizDate("2026-12-31")).toBe("2027-01-01");
  });
});

describe("getNextDailyResetTime", () => {
  it("現在時刻より未来の時刻を返す", () => {
    const now = new Date("2026-03-14T10:00:00Z");
    vi.setSystemTime(now);
    const nextReset = getNextDailyResetTime();
    expect(nextReset.getTime()).toBeGreaterThan(now.getTime());
  });

  it("返値の時刻はJST 4:00（UTC 19:00の前日相当）", () => {
    // 2026-03-14 10:00 JST = 2026-03-14 01:00 UTC
    vi.setSystemTime(new Date("2026-03-14T01:00:00Z"));
    const nextReset = getNextDailyResetTime();
    // 次のリセット: 2026-03-14 04:00 JST = 2026-03-13 19:00 UTC
    expect(nextReset.getUTCHours()).toBe(19);
  });
});
