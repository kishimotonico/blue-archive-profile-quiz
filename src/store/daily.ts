import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import * as v from "valibot";
import type { QuizKey } from "../quiz-core/key";
import type { QuestionResult, QuestionRecord, RecordStats } from "../quiz-core";
import { summarizeRecords } from "../quiz-core";
import { definePersistedDocument } from "./persistedDocument";

export interface DailyProgress {
  key: QuizKey;
  revealedHintCount: number;
  // hints[] は保存しない。key から完全再生成可能
}

export const dailyProgressAtom = atomWithStorage<DailyProgress | null>(
  "blue-archive-quiz-daily-progress-v2",
  null,
  undefined,
  { getOnInit: true },
);

export interface DailyHistory {
  schemaVersion: 1;
  records: QuestionRecord[]; // key.baseDate 昇順、baseDate は一意
}

export const DAILY_HISTORY_KEY = "blue-archive-quiz-daily-history";

const emptyDailyHistory: DailyHistory = { schemaVersion: 1, records: [] };

// 全階層 looseObject。未知フィールドを落とさないため（仕様）
const quizKeySchema = v.looseObject({
  version: v.number(),
  baseDate: v.string(),
  seed: v.number(),
});

const recordedResultSchema = v.looseObject({
  studentId: v.string(),
  usedHintCount: v.number(),
  correct: v.boolean(),
  userAnswer: v.optional(v.nullable(v.string())),
  score: v.number(),
});

const questionRecordSchema = v.looseObject({
  key: quizKeySchema,
  result: recordedResultSchema,
  playedAt: v.number(),
});

export const dailyHistorySchema: v.GenericSchema<DailyHistory> = v.looseObject({
  schemaVersion: v.literal(1),
  records: v.array(questionRecordSchema),
});

const compareByBaseDate = (a: QuestionRecord, b: QuestionRecord) =>
  a.key.baseDate.localeCompare(b.key.baseDate);

const DAILY_RESULTS_V3_KEY = "blue-archive-quiz-daily-results-v3";

const dailyResultsV3Schema = v.looseObject({
  recent: v.array(
    v.looseObject({
      key: quizKeySchema,
      studentId: v.string(),
      score: v.number(),
      revealedHintCount: v.number(),
      correct: v.boolean(),
      timestamp: v.number(),
    }),
  ),
  // aggregated は詳細を戻せないので読まない
});

export function importDailyHistoryFromV3(doc: unknown): unknown {
  const parsed = v.safeParse(dailyResultsV3Schema, doc);
  if (!parsed.success) return undefined; // 汎用層の検証で empty になる
  const records: QuestionRecord[] = parsed.output.recent
    .map((r) => ({
      key: r.key,
      // userAnswer は書かない。null にすると誤答がすべてギブアップ扱いになる
      result: {
        studentId: r.studentId,
        usedHintCount: r.revealedHintCount,
        correct: r.correct,
        score: r.score,
      },
      playedAt: r.timestamp,
    }))
    .sort(compareByBaseDate);
  return { schemaVersion: 1, records } satisfies DailyHistory;
}

export const dailyHistoryDocument = definePersistedDocument<DailyHistory>({
  key: DAILY_HISTORY_KEY,
  schema: dailyHistorySchema,
  empty: emptyDailyHistory,
  migrations: [],
  legacyImports: [{ key: DAILY_RESULTS_V3_KEY, import: importDailyHistoryFromV3 }],
});

export const dailyHistoryAtom = dailyHistoryDocument.atom;

// 完了済みの日を再訪したときに二重記録しないよう、同じ baseDate が既にあれば何もしない
export const recordDailyResultAtom = atom(
  null,
  (get, set, { key, result }: { key: QuizKey; result: QuestionResult }) => {
    const history = get(dailyHistoryAtom);
    if (history.records.some((r) => r.key.baseDate === key.baseDate)) return;
    const record: QuestionRecord = { key, result, playedAt: Date.now() };
    // history をスプレッドするのは、新しいコードが足した未知の最上位フィールドを落とさないため
    set(dailyHistoryAtom, {
      ...history,
      records: [...history.records, record].sort(compareByBaseDate),
    });
  },
);

export const dailyStatsAtom = atom<RecordStats>((get) =>
  summarizeRecords(get(dailyHistoryAtom).records),
);
