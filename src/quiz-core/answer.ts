import type { Student } from "./types";

export type AnswerResult =
  | { type: "correct" }
  | { type: "wrong_student"; answeredStudent: Student }
  | { type: "unknown" };

export function hiraganaToKatakana(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, (match) => {
    const chr = match.charCodeAt(0) + 0x60;
    return String.fromCharCode(chr);
  });
}

export function normalizeAnswer(answer: string): string {
  return hiraganaToKatakana(answer).replace(/\s+/g, "").toLowerCase();
}

/** フルネーム・名前のみのどちらでも正解とする */
export function checkAnswer(answer: string, student: Student): boolean {
  const normalized = normalizeAnswer(answer);

  const normalizedFullName = normalizeAnswer(student.fullName);
  const normalizedName = normalizeAnswer(student.name);

  return normalized === normalizedFullName || normalized === normalizedName;
}

export function validateAnswer(
  answer: string,
  correctStudent: Student,
  allStudents: readonly Student[],
): AnswerResult {
  if (checkAnswer(answer, correctStudent)) {
    return { type: "correct" };
  }

  const matchedStudent = allStudents.find((student) => checkAnswer(answer, student));

  if (matchedStudent) {
    return { type: "wrong_student", answeredStudent: matchedStudent };
  } else {
    return { type: "unknown" };
  }
}
