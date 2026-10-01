import type { Student } from "./types";
import { seededRandomV1, seededRandomV2 } from "./random";

export type StudentEntry = {
  profile: Omit<Student, "id" | "portraitImage" | "availableFrom">;
  images: { portrait: string };
  availableFrom: string | null;
};

export function parseStudents(data: Record<string, StudentEntry>): Student[] {
  return Object.entries(data).map(([id, entry]) => ({
    id,
    ...entry.profile,
    portraitImage: entry.images.portrait,
    availableFrom: entry.availableFrom,
  }));
}

export function extractFamilyName(fullName: string): string {
  const match = fullName.match(/^(.*[^ァ-ヴー])([ァ-ヴー]+)$/);
  if (match) {
    return match[1];
  }
  return fullName;
}

export function getStudentPool(students: Student[], baseDate: string): Student[] {
  return students
    .filter((s): s is Student & { availableFrom: string } => s.availableFrom !== null)
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

export function pickStudentV2(pool: Student[], seed: number): Student {
  if (pool.length === 0) throw new Error("Student pool is empty");
  const rng = seededRandomV2(seed);
  return pool[Math.floor(rng() * pool.length)];
}
