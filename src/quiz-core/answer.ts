import type { Student } from './types';

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
    .replace(/\s+/g, '') // 空白を除去
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
