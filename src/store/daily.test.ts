// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { createStore } from "jotai";
import * as v from "valibot";
import {
  dailyHistoryDocument,
  dailyHistoryAtom,
  dailyStatsAtom,
  recordDailyResultAtom,
  dailyHistorySchema,
  DAILY_HISTORY_KEY,
  type DailyHistory,
} from "./daily";
import { summarizeRecords, type QuestionRecord } from "../quiz-core";
import type { QuizKey } from "../quiz-core/key";
import v3Raw from "./__fixtures__/daily-results-v3.json?raw";
import v1Raw from "./__fixtures__/daily-history-v1.json?raw";

const DAILY_RESULTS_V3_KEY = "blue-archive-quiz-daily-results-v3";

const emptyHistory: DailyHistory = { schemaVersion: 1, records: [] };

const makeKey = (baseDate: string): QuizKey => ({
  version: 1,
  baseDate,
  seed: Number(baseDate.replace(/-/g, "")),
});

const makeResult = (overrides: Partial<QuestionRecord["result"]> = {}) => ({
  studentId: "s0",
  usedHintCount: 3,
  correct: true,
  userAnswer: "s0",
  score: 5,
  ...overrides,
});

const isSortedByBaseDateAscending = (records: readonly QuestionRecord[]): boolean =>
  records.every(
    (r, i) => i === 0 || records[i - 1].key.baseDate.localeCompare(r.key.baseDate) <= 0,
  );

beforeEach(() => {
  localStorage.clear();
});

describe("フィクスチャ到達性", () => {
  it.each([
    { storageKey: DAILY_RESULTS_V3_KEY, raw: v3Raw },
    { storageKey: DAILY_HISTORY_KEY, raw: v1Raw },
  ])("$storageKey から現在の形に到達して検証を通る", ({ storageKey, raw }) => {
    localStorage.setItem(storageKey, raw);

    const doc = dailyHistoryDocument.storage.getItem(DAILY_HISTORY_KEY, emptyHistory);

    expect(v.safeParse(dailyHistorySchema, doc).success).toBe(true);
    expect(doc.records.length).toBeGreaterThan(0);
    expect(isSortedByBaseDateAscending(doc.records)).toBe(true);
    const baseDates = doc.records.map((r) => r.key.baseDate);
    expect(new Set(baseDates).size).toBe(baseDates.length);
    // 本体キーに保存されていること。v1 フィクスチャは移行が起きないので元の文字列のまま保たれ、
    // v3 は取り込みで JSON.stringify(doc) に書き換わるため、文字列そのものではなく再パース結果で比較する
    expect(JSON.parse(localStorage.getItem(DAILY_HISTORY_KEY)!)).toEqual(doc);

    const second = dailyHistoryDocument.storage.getItem(DAILY_HISTORY_KEY, emptyHistory);
    expect(second).toEqual(doc);
  });
});

describe("v3 からの取り込み", () => {
  it("recent を QuestionRecord に変換し、aggregated は捨てる", () => {
    localStorage.setItem(DAILY_RESULTS_V3_KEY, v3Raw);

    const doc = dailyHistoryDocument.storage.getItem(DAILY_HISTORY_KEY, emptyHistory);

    expect(doc.records).toHaveLength(3);
    for (const record of doc.records) {
      expect("userAnswer" in record.result).toBe(false);
    }
    const byBaseDate = Object.fromEntries(doc.records.map((r) => [r.key.baseDate, r]));
    expect(byBaseDate["2026-04-22"].result.usedHintCount).toBe(10);
    expect(byBaseDate["2026-04-22"].playedAt).toBe(1776900000000);
    expect(byBaseDate["2026-04-21"].key.version).toBe(1);
    expect(byBaseDate["2026-05-01"].key.version).toBe(2);

    expect(localStorage.getItem(DAILY_RESULTS_V3_KEY)).toBeNull();
    expect(localStorage.getItem(DAILY_HISTORY_KEY)).toBe(JSON.stringify(doc));
  });
});

describe("v1 フィクスチャ（未知フィールド・欠落の保持）", () => {
  it("note が文書・record・result・key の各階層で残り、localStorage は変わらない", () => {
    localStorage.setItem(DAILY_HISTORY_KEY, v1Raw);

    const doc = dailyHistoryDocument.storage.getItem(
      DAILY_HISTORY_KEY,
      emptyHistory,
    ) as DailyHistory & {
      note?: string;
    };

    expect(doc.note).toBe("doc");
    const shiroko = doc.records.find((r) => r.result.studentId === "shiroko") as QuestionRecord & {
      note?: string;
    };
    expect(shiroko.note).toBe("record");
    expect((shiroko.result as { note?: string }).note).toBe("result");
    expect((shiroko.key as QuizKey & { note?: string }).note).toBe("key");

    const hoshino = doc.records.find((r) => r.result.studentId === "hoshino")!;
    expect(hoshino.result.userAnswer).toBeNull();
    const aru = doc.records.find((r) => r.result.studentId === "aru")!;
    expect(aru.result.userAnswer).toBe("アル");
    // shiroko のフィクスチャは userAnswer キー自体を持たない（欠落 = 未記録）
    expect("userAnswer" in shiroko.result).toBe(false);

    expect(localStorage.getItem(DAILY_HISTORY_KEY)).toBe(v1Raw);
  });
});

describe("本体キーと v3 が両方ある場合", () => {
  it("v3 は読まれず残る", () => {
    localStorage.setItem(DAILY_HISTORY_KEY, v1Raw);
    localStorage.setItem(DAILY_RESULTS_V3_KEY, v3Raw);

    dailyHistoryDocument.storage.getItem(DAILY_HISTORY_KEY, emptyHistory);

    expect(localStorage.getItem(DAILY_RESULTS_V3_KEY)).toBe(v3Raw);
  });
});

describe("recordDailyResultAtom", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("記録すると records に1件入り playedAt が正の値になる", () => {
    store.set(recordDailyResultAtom, { key: makeKey("2026-01-01"), result: makeResult() });

    const history = store.get(dailyHistoryAtom);
    expect(history.records).toHaveLength(1);
    expect(history.records[0].playedAt).toBeGreaterThan(0);
    expect(history.records[0].result).toEqual(makeResult());
  });

  it("同じ baseDate を二度記録しても1件で最初の score が残る", () => {
    store.set(recordDailyResultAtom, {
      key: makeKey("2026-01-01"),
      result: makeResult({ score: 5 }),
    });
    store.set(recordDailyResultAtom, {
      key: makeKey("2026-01-01"),
      result: makeResult({ score: 9 }),
    });

    const history = store.get(dailyHistoryAtom);
    expect(history.records).toHaveLength(1);
    expect(history.records[0].result.score).toBe(5);
  });

  it("01-03, 01-01, 01-02 の順に記録しても baseDate 昇順が保たれる", () => {
    store.set(recordDailyResultAtom, { key: makeKey("2026-01-03"), result: makeResult() });
    store.set(recordDailyResultAtom, { key: makeKey("2026-01-01"), result: makeResult() });
    store.set(recordDailyResultAtom, { key: makeKey("2026-01-02"), result: makeResult() });

    const history = store.get(dailyHistoryAtom);
    expect(history.records.map((r) => r.key.baseDate)).toEqual([
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
    ]);
  });

  it("シードした最上位の未知フィールドが記録後も残る", () => {
    store.set(dailyHistoryAtom, { ...emptyHistory, extra: 1 } as DailyHistory);

    store.set(recordDailyResultAtom, { key: makeKey("2026-01-01"), result: makeResult() });

    expect((store.get(dailyHistoryAtom) as DailyHistory & { extra?: number }).extra).toBe(1);
  });
});

describe("dailyStatsAtom", () => {
  it("シードした records から summarizeRecords と同じ統計を返す", () => {
    const store = createStore();
    const records: QuestionRecord[] = [
      { key: makeKey("2026-01-01"), result: makeResult({ score: 10 }), playedAt: 1 },
      { key: makeKey("2026-01-02"), result: makeResult({ score: 0, correct: false }), playedAt: 2 },
    ];
    store.set(dailyHistoryAtom, { schemaVersion: 1, records });

    expect(store.get(dailyStatsAtom)).toEqual(summarizeRecords(records));
  });
});
