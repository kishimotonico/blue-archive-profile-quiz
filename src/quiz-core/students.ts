import type { Student } from './types';

let studentsCache: Student[] | null = null;

/**
 * 全生徒データを取得
 */
export async function loadStudents(): Promise<Student[]> {
  if (studentsCache) {
    return studentsCache;
  }

  const response = await fetch(`${import.meta.env.BASE_URL}data/students.json`);
  const data = await response.json() as Record<string, Student>;

  studentsCache = Object.values(data);
  return studentsCache;
}

/**
 * フルネームから姓を抽出
 * 例: "陸八魔アル" → "陸八魔"
 */
export function extractFamilyName(fullName: string): string {
  // カタカナ部分（名）を除去して姓を取得
  // 最後のカタカナ連続部分を名として判定
  const match = fullName.match(/^(.+?)([ァ-ヴー]+)$/);
  if (match) {
    return match[1];
  }
  return fullName;
}

/**
 * IDから生徒を検索
 */
export async function getStudentById(id: string): Promise<Student | undefined> {
  const students = await loadStudents();
  return students.find(s => s.id === id);
}

/**
 * ランダムな生徒を1人取得
 */
export async function getRandomStudent(seed?: number): Promise<Student> {
  const students = await loadStudents();

  if (seed !== undefined) {
    // シードベースのランダム選択
    const index = seed % students.length;
    return students[index];
  }

  const index = Math.floor(Math.random() * students.length);
  return students[index];
}

/**
 * ランダムな生徒をN人取得（重複なし）
 */
export async function getRandomStudents(count: number, seed?: number): Promise<Student[]> {
  const students = await loadStudents();
  const shuffled = [...students];

  if (seed !== undefined) {
    // シードベースのシャッフル（簡易版）
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (seed * (i + 1)) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  } else {
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  }

  return shuffled.slice(0, count);
}
