import type { QuizKey } from "./key";
import type { QuizQuestion } from "./types";
import { getStudentPool, pickStudentV1 } from "./students";
import { generateHintsV1 } from "./hints";
import { deriveSeedV1 } from "./random";

export async function createQuestion(key: QuizKey): Promise<QuizQuestion> {
  switch (key.version) {
    case 1:
      return createQuestionV1(key);
    default:
      throw new Error(`Unsupported algorithm version: ${key.version}`);
  }
}

export async function createQuestionSet(key: QuizKey, count: number): Promise<QuizQuestion[]> {
  switch (key.version) {
    case 1:
      return createQuestionSetV1(key, count);
    default:
      throw new Error(`Unsupported algorithm version: ${key.version}`);
  }
}

async function createQuestionV1(key: QuizKey): Promise<QuizQuestion> {
  const pool = await getStudentPool(key.baseDate);
  const student = pickStudentV1(pool, key.seed);
  const hints = generateHintsV1(student, deriveSeedV1(key.seed, "hints"));
  return { student, hints, key };
}

async function createQuestionSetV1(masterKey: QuizKey, count: number): Promise<QuizQuestion[]> {
  const pool = await getStudentPool(masterKey.baseDate);

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
  return Promise.all(subKeys.map((k) => createQuestionV1(k)));
}
