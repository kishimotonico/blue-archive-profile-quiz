import type { Student } from "./types";

/**
 * 回答結果の型
 */
export type AnswerResult =
  | { type: "correct" }
  | { type: "wrong_student"; answeredStudent: Student }
  | { type: "unknown" };

/**
 * ひらがなをカタカナに変換
 */
export function hiraganaToKatakana(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, (match) => {
    const chr = match.charCodeAt(0) + 0x60;
    return String.fromCharCode(chr);
  });
}

/**
 * 文字列を正規化（カタカナ変換、空白除去、小文字化）
 */
export function normalizeAnswer(answer: string): string {
  return hiraganaToKatakana(answer)
    .replace(/\s+/g, "") // 空白を除去
    .toLowerCase();
}

/**
 * 回答が正解かどうかを判定
 * - フルネーム（陸八魔アル）
 * - 名前のみ（アル）
 * どちらでも正解とする
 */
export function checkAnswer(answer: string, student: Student): boolean {
  const normalized = normalizeAnswer(answer);

  // フルネームと名前をカタカナに正規化
  const normalizedFullName = normalizeAnswer(student.fullName);
  const normalizedName = normalizeAnswer(student.name);

  return normalized === normalizedFullName || normalized === normalizedName;
}

/**
 * 回答候補を生成（デバッグ用）
 */
export function getAnswerVariants(student: Student): string[] {
  return [
    student.fullName,
    student.name,
    hiraganaToKatakana(student.fullName),
    hiraganaToKatakana(student.name),
  ];
}

/**
 * 回答を検証し、正解/誤答/不明を判定
 * @param answer ユーザーの回答
 * @param correctStudent 正解の生徒
 * @param allStudents 全生徒リスト
 * @returns 回答結果
 */
export function validateAnswer(
  answer: string,
  correctStudent: Student,
  allStudents: Student[],
): AnswerResult {
  // 正解判定
  if (checkAnswer(answer, correctStudent)) {
    return { type: "correct" };
  }

  // 全生徒から該当する生徒を検索
  const matchedStudent = allStudents.find((student) => checkAnswer(answer, student));

  if (matchedStudent) {
    // 存在する生徒だが、正解ではない
    return { type: "wrong_student", answeredStudent: matchedStudent };
  } else {
    // 該当する生徒が存在しない
    return { type: "unknown" };
  }
}
