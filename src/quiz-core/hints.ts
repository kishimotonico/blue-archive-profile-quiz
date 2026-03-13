import type { Student, Hint, HintType, QuizQuestion } from './types';
import { extractFamilyName } from './students';
import { seededRandom, shuffle } from './random';

/**
 * ヒントタイプごとのラベル定義
 */
const HINT_LABELS: Record<HintType, string> = {
  school: '学園',
  club: '部活',
  age: '年齢',
  birthday: '誕生日',
  height: '身長',
  hobby: '趣味',
  weaponName: '武器',
  cv: 'CV',
  familyName: '姓',
};

/**
 * 生徒からヒント配列を生成
 */
export function generateHints(student: Student): Hint[] {
  const hints: Hint[] = [
    { type: 'school', label: HINT_LABELS.school, value: `${student.school} / ${student.grade}` },
    { type: 'club', label: HINT_LABELS.club, value: student.club },
    { type: 'age', label: HINT_LABELS.age, value: student.age },
    { type: 'birthday', label: HINT_LABELS.birthday, value: student.birthday },
    { type: 'height', label: HINT_LABELS.height, value: student.height },
    { type: 'hobby', label: HINT_LABELS.hobby, value: student.hobby },
    { type: 'weaponName', label: HINT_LABELS.weaponName, value: student.weaponName },
    { type: 'cv', label: HINT_LABELS.cv, value: student.cv },
    { type: 'familyName', label: HINT_LABELS.familyName, value: extractFamilyName(student.fullName) },
  ];

  return hints;
}

/**
 * ヒント配列をシャッフル
 */
function shuffleHints(hints: Hint[], seed?: number): Hint[] {
  return shuffle([...hints], seed !== undefined ? seededRandom(seed) : Math.random);
}

/**
 * クイズ問題を生成
 */
export function createQuizQuestion(student: Student, seed?: number): QuizQuestion {
  const hints = generateHints(student);
  const shuffledHints = shuffleHints(hints, seed);

  return {
    student,
    hints: shuffledHints,
  };
}
