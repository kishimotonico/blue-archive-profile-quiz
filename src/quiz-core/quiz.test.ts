import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { createQuestion, createQuestionSet } from "./quiz";
import { dateToSeed } from "./daily";
import { deriveSeedV1, seededRandomV2 } from "./random";
import { pickStudentV2 } from "./students";
import type { QuizKey } from "./key";

// students.ts の loadStudents は fetch + import.meta.env.BASE_URL を使うため、
// テスト環境では global.fetch をモックして data/students.json を直接返す。
const studentsJsonPath = path.resolve(process.cwd(), "data/students.json");
const studentsJsonText = readFileSync(studentsJsonPath, "utf-8");

beforeAll(() => {
  vi.stubGlobal("fetch", vi.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(JSON.parse(studentsJsonText)),
    })
  ));
  // import.meta.env.BASE_URL はテスト環境では undefined になりうるが、
  // モック fetch では引数を使わないため問題なし
});

afterAll(() => {
  vi.unstubAllGlobals();
});

// テスト用の共通日付（pool が十分存在する日）
const BASE_DATE = "2026-06-20";

describe("createQuestion（version:1）", () => {
  it("version:1 キーを渡すと createQuestionV1 経由で解決される", async () => {
    const key: QuizKey = { version: 1, baseDate: BASE_DATE, seed: dateToSeed(BASE_DATE) };
    const q1 = await createQuestion(key);
    const q2 = await createQuestion(key);

    expect(q1.student.id).toBe(q2.student.id);
    expect(q1.hints.map((h) => h.type)).toEqual(q2.hints.map((h) => h.type));
    expect(q1.key).toEqual(key);
  });
});

describe("createQuestion（version:2）", () => {
  it("同じ version:2 キーを渡すと同じ生徒・同じヒント順を返す（決定論的）", async () => {
    const key: QuizKey = { version: 2, baseDate: BASE_DATE, seed: dateToSeed(BASE_DATE) };
    const q1 = await createQuestion(key);
    const q2 = await createQuestion(key);

    expect(q1.student.id).toBe(q2.student.id);
    expect(q1.hints.map((h) => h.type)).toEqual(q2.hints.map((h) => h.type));
    expect(q1.key).toEqual(key);
  });

  it("version:2 の生徒選定は deriveSeedV1(seed, 'pick') を使う（生の seed を使わない）", async () => {
    const seed = dateToSeed(BASE_DATE);
    const key: QuizKey = { version: 2, baseDate: BASE_DATE, seed };

    // createQuestion の内部動作を検証：
    // v2 では pickStudentV2(pool, deriveSeedV1(seed, "pick")) が呼ばれているはず
    const q = await createQuestion(key);

    // students.json を直接読んで pool を再構築して期待値を計算
    const data = JSON.parse(studentsJsonText) as Record<string, { profile: { fullName: string; name: string; school: string; grade: string | null; club: string; age: string; birthday: string; height: string; hobby: string; weaponName: string; cv: string; skills: { ex: string; normal: string; passive: string; sub: string } }; images: { portrait: string }; availableFrom: string | null }>;
    const pool = Object.entries(data)
      .filter(([, e]) => e.availableFrom !== null && e.availableFrom <= BASE_DATE)
      .sort((a, b) =>
        a[1].availableFrom! !== b[1].availableFrom!
          ? a[1].availableFrom! < b[1].availableFrom! ? -1 : 1
          : a[0] < b[0] ? -1 : 1
      )
      .map(([id, e]) => ({ id, ...e.profile, portraitImage: e.images.portrait, availableFrom: e.availableFrom }));

    const expectedStudent = pickStudentV2(
      pool as Parameters<typeof pickStudentV2>[0],
      deriveSeedV1(seed, "pick")
    );
    expect(q.student.id).toBe(expectedStudent.id);
  });

  it("version:2 と version:1 では（通常）異なる生徒が選ばれる", async () => {
    const seed = dateToSeed(BASE_DATE);
    const keyV1: QuizKey = { version: 1, baseDate: BASE_DATE, seed };
    const keyV2: QuizKey = { version: 2, baseDate: BASE_DATE, seed };

    const qV1 = await createQuestion(keyV1);
    const qV2 = await createQuestion(keyV2);

    // 稀に一致することもあり得るが、このseedでは異なるはず
    // v1 は生の seed を seededRandomV1 に、v2 は deriveSeedV1(seed,"pick") を seededRandomV2 に渡す
    expect(qV1.student.id).not.toBe(qV2.student.id);
  });

  it("未知の version を渡すとエラーを投げる", async () => {
    const key: QuizKey = { version: 99, baseDate: BASE_DATE, seed: 0 };
    await expect(createQuestion(key)).rejects.toThrow("Unsupported algorithm version: 99");
  });
});

describe("連続する日替わりキーで選ばれる生徒の分散（v2 相関解消）", () => {
  it("連続30日の日替わり v2 キーで選ばれる pool インデックスが等差数列にならない", async () => {
    const days: string[] = [];
    // 2026-04-01 から 30日分
    for (let i = 0; i < 30; i++) {
      const date = new Date(Date.UTC(2026, 3, 1 + i));
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, "0");
      const d = String(date.getUTCDate()).padStart(2, "0");
      days.push(`${y}-${m}-${d}`);
    }

    // 各日で選ばれる生徒の pool インデックスを求める
    const data = JSON.parse(studentsJsonText) as Record<string, { profile: { fullName: string; name: string; school: string; grade: string | null; club: string; age: string; birthday: string; height: string; hobby: string; weaponName: string; cv: string; skills: { ex: string; normal: string; passive: string; sub: string } }; images: { portrait: string }; availableFrom: string | null }>;
    const buildPool = (baseDate: string) =>
      Object.entries(data)
        .filter(([, e]) => e.availableFrom !== null && e.availableFrom <= baseDate)
        .sort((a, b) =>
          a[1].availableFrom! !== b[1].availableFrom!
            ? a[1].availableFrom! < b[1].availableFrom! ? -1 : 1
            : a[0] < b[0] ? -1 : 1
        )
        .map(([id, e]) => ({ id, ...e.profile, portraitImage: e.images.portrait, availableFrom: e.availableFrom }));

    const indicesV2: number[] = [];
    const indicesV1: number[] = [];

    for (const baseDate of days) {
      const seed = dateToSeed(baseDate);
      const pool = buildPool(baseDate) as Parameters<typeof pickStudentV2>[0];

      // v2: deriveSeedV1(seed, "pick") → seededRandomV2
      const studentV2 = pickStudentV2(pool, deriveSeedV1(seed, "pick"));
      indicesV2.push(pool.findIndex((s) => s.id === studentV2.id));

      // v1: 生の seed → seededRandomV1
      const rngV1 = (await import("./random")).seededRandomV1(seed);
      indicesV1.push(Math.floor(rngV1() * pool.length));
    }

    // v1 の差分（隣接日のインデックス差）
    const diffsV1: number[] = [];
    for (let i = 1; i < indicesV1.length; i++) {
      diffsV1.push(indicesV1[i] - indicesV1[i - 1]);
    }
    // v1 の差分が一定値に偏っていることを確認（等差数列的な特性）
    // 実測: 29日分の差分が 8 種類程度に集中する強い周期性を持つ
    // （約 ±68, ±64 を繰り返すパターン）
    const uniqueDiffsV1 = new Set(diffsV1);
    expect(uniqueDiffsV1.size).toBeLessThanOrEqual(10);

    // v2 の差分が十分にばらけていることを確認
    const diffsV2: number[] = [];
    for (let i = 1; i < indicesV2.length; i++) {
      diffsV2.push(indicesV2[i] - indicesV2[i - 1]);
    }
    const uniqueDiffsV2 = new Set(diffsV2);
    // v2 では差分の種類が十分多い（29日分の差分のうち少なくとも20種類以上）
    expect(uniqueDiffsV2.size).toBeGreaterThan(20);

    // さらに v1 と v2 の差分の多様性を対比（v2 の方が明らかに多い）
    expect(uniqueDiffsV2.size).toBeGreaterThan(uniqueDiffsV1.size);
  });
});

describe("createQuestionSet（version:2）", () => {
  it("10問が重複なく生成される", async () => {
    const masterKey: QuizKey = { version: 2, baseDate: BASE_DATE, seed: dateToSeed(BASE_DATE) };
    const questions = await createQuestionSet(masterKey, 10);

    expect(questions).toHaveLength(10);
    const studentIds = questions.map((q) => q.student.id);
    const uniqueIds = new Set(studentIds);
    expect(uniqueIds.size).toBe(10);
  });

  it("各 subKey 単独で createQuestion を呼ぶと同じ生徒が得られる（自己完結性）", async () => {
    const masterKey: QuizKey = { version: 2, baseDate: BASE_DATE, seed: dateToSeed(BASE_DATE) };
    const questions = await createQuestionSet(masterKey, 10);

    for (const q of questions) {
      const subKey = q.key;
      expect(subKey.version).toBe(2);
      const restored = await createQuestion(subKey);
      expect(restored.student.id).toBe(q.student.id);
      expect(restored.hints.map((h) => h.type)).toEqual(q.hints.map((h) => h.type));
    }
  });

  it("masterKey の version は subKey にも引き継がれる", async () => {
    const masterKey: QuizKey = { version: 2, baseDate: BASE_DATE, seed: dateToSeed(BASE_DATE) };
    const questions = await createQuestionSet(masterKey, 5);

    for (const q of questions) {
      expect(q.key.version).toBe(2);
      expect(q.key.baseDate).toBe(BASE_DATE);
    }
  });

  it("同じ masterKey から生成される問題セットは決定論的", async () => {
    const masterKey: QuizKey = { version: 2, baseDate: BASE_DATE, seed: dateToSeed(BASE_DATE) };
    const set1 = await createQuestionSet(masterKey, 5);
    const set2 = await createQuestionSet(masterKey, 5);

    const ids1 = set1.map((q) => q.student.id);
    const ids2 = set2.map((q) => q.student.id);
    expect(ids1).toEqual(ids2);
  });
});

describe("seededRandomV2 確率的均一性（smoke test）", () => {
  it("1000回生成した値の平均が 0.5 に近い", () => {
    const rng = seededRandomV2(0xdeadbeef);
    let sum = 0;
    const N = 1000;
    for (let i = 0; i < N; i++) sum += rng();
    const mean = sum / N;
    // 期待値 0.5 から ±0.05 以内
    expect(mean).toBeGreaterThan(0.45);
    expect(mean).toBeLessThan(0.55);
  });
});
