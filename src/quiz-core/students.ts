import type { Student } from "./types";
import { seededRandomV1 } from "./random";

let studentsCache: Student[] | null = null;

type StudentEntry = {
  profile: Omit<Student, "id" | "portraitImage" | "availableFrom">;
  images: { portrait: string };
  availableFrom: string;
};

export async function loadStudents(): Promise<Student[]> {
  if (studentsCache) {
    return studentsCache;
  }

  const response = await fetch(`${import.meta.env.BASE_URL}data/students.json`);
  const data = (await response.json()) as Record<string, StudentEntry>;

  studentsCache = Object.entries(data).map(([id, entry]) => ({
    id,
    ...entry.profile,
    portraitImage: entry.images.portrait,
    availableFrom: entry.availableFrom,
  }));
  return studentsCache;
}

export function extractFamilyName(fullName: string): string {
  const match = fullName.match(/^(.*[^\ァ-ヴー])([ァ-ヴー]+)$/);
  if (match) {
    return match[1];
  }
  return fullName;
}

export async function getStudentById(id: string): Promise<Student | undefined> {
  const students = await loadStudents();
  return students.find((s) => s.id === id);
}

export async function getStudentPool(baseDate: string): Promise<Student[]> {
  const all = await loadStudents();
  return all
    .filter((s) => s.availableFrom <= baseDate)
    .sort((a, b) =>
      a.availableFrom !== b.availableFrom
        ? a.availableFrom < b.availableFrom
          ? -1
          : 1
        : a.id < b.id
          ? -1
          : 1,
    );
}

export function pickStudentV1(pool: Student[], seed: number): Student {
  if (pool.length === 0) throw new Error("Student pool is empty");
  const rng = seededRandomV1(seed);
  return pool[Math.floor(rng() * pool.length)];
}
