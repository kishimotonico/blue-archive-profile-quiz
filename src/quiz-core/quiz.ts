import type { QuizKey } from "./key";
import type { QuizQuestion, Student } from "./types";
import { getStudentPool, pickStudentV1, pickStudentV2 } from "./students";
import { generateHintsV1, generateHintsV2 } from "./hints";
import { deriveSeedV1 } from "./random";

export function createQuestion(students: Student[], key: QuizKey): QuizQuestion {
  switch (key.version) {
    case 1:
      return createQuestionV1(students, key);
    case 2:
      return createQuestionV2(students, key);
    default:
      throw new Error(`Unsupported algorithm version: ${key.version}`);
  }
}

export function createQuestionSet(
  students: Student[],
  key: QuizKey,
  count: number,
): QuizQuestion[] {
  switch (key.version) {
    case 1:
      return createQuestionSetV1(students, key, count);
    case 2:
      return createQuestionSetV2(students, key, count);
    default:
      throw new Error(`Unsupported algorithm version: ${key.version}`);
  }
}

function createQuestionV1(students: Student[], key: QuizKey): QuizQuestion {
  const pool = getStudentPool(students, key.baseDate);
  const student = pickStudentV1(pool, key.seed);
  const hints = generateHintsV1(student, deriveSeedV1(key.seed, "hints"));
  return { student, hints, key };
}

function createQuestionSetV1(
  students: Student[],
  masterKey: QuizKey,
  count: number,
): QuizQuestion[] {
  const pool = getStudentPool(students, masterKey.baseDate);

  // 各 subKey 単独で createQuestion(subKey) を呼んでも同じ生徒が復元されるよう、
  // 各問の生徒選定も subKey.seed から pickStudentV1 で行う（QuizKey の自己完結性を保証）。
  // 重複排除は attempt カウンタで決定論的に処理する。
  const usedStudentIds = new Set<string>();
  const subKeys: QuizKey[] = [];
  let attempt = 0;
  while (subKeys.length < count) {
    if (attempt > pool.length * 100) {
      throw new Error("Failed to assemble unique question set: pool too small or seed exhausted");
    }
    const subSeed = deriveSeedV1(masterKey.seed, "q", attempt++);
    const student = pickStudentV1(pool, subSeed);
    if (!usedStudentIds.has(student.id)) {
      usedStudentIds.add(student.id);
      subKeys.push({
        version: masterKey.version,
        baseDate: masterKey.baseDate,
        seed: subSeed,
      });
    }
  }
  return subKeys.map((k) => createQuestionV1(students, k));
}

function createQuestionV2(students: Student[], key: QuizKey): QuizQuestion {
  const pool = getStudentPool(students, key.baseDate);
  // 生の key.seed をそのまま使わず "pick" タグで派生させることで連続日の相関を消す
  const student = pickStudentV2(pool, deriveSeedV1(key.seed, "pick"));
  const hints = generateHintsV2(student, deriveSeedV1(key.seed, "hints"));
  return { student, hints, key };
}

function createQuestionSetV2(
  students: Student[],
  masterKey: QuizKey,
  count: number,
): QuizQuestion[] {
  const pool = getStudentPool(students, masterKey.baseDate);

  // 各 subKey 単独で createQuestion(subKey) を呼んでも同じ生徒が復元されるよう、
  // 重複排除の生徒判定も createQuestionV2 内と同一の式（"pick" 派生を挟む）で行う。
  const usedStudentIds = new Set<string>();
  const subKeys: QuizKey[] = [];
  let attempt = 0;
  while (subKeys.length < count) {
    if (attempt > pool.length * 100) {
      throw new Error("Failed to assemble unique question set: pool too small or seed exhausted");
    }
    const subSeed = deriveSeedV1(masterKey.seed, "q", attempt++);
    // createQuestionV2 と同一の生徒選定式: deriveSeedV1(subSeed, "pick") を pickStudentV2 に渡す
    const student = pickStudentV2(pool, deriveSeedV1(subSeed, "pick"));
    if (!usedStudentIds.has(student.id)) {
      usedStudentIds.add(student.id);
      subKeys.push({
        version: masterKey.version,
        baseDate: masterKey.baseDate,
        seed: subSeed,
      });
    }
  }
  return subKeys.map((k) => createQuestionV2(students, k));
}
