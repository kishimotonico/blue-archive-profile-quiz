import type { Student, Hint, HintType, QuizQuestion } from './types';
import { extractFamilyName } from './students';

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
 * シンプルなシード付き乱数生成器
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * ヒント配列をシャッフル
 */
export function shuffleHints(hints: Hint[], seed?: number): Hint[] {
  const shuffled = [...hints];

  if (seed !== undefined) {
    // シードベースのシャッフル
    const random = seededRandom(seed);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  } else {
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  }

  return shuffled;
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
