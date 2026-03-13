import { describe, it, expect } from 'vitest';
import { generateHints, createQuizQuestion } from './hints';
import type { Student, HintType } from './types';

const makeStudent = (overrides: Partial<Student> = {}): Student => ({
  id: "miyako",
  fullName: "月雪ミヤコ",
  name: "ミヤコ",
  school: "SRT特殊学園",
  grade: "1年生",
  club: "RABBIT小隊",
  age: "15歳",
  birthday: "1月7日",
  height: "156cm",
  hobby: "動物系の動画鑑賞",
  weaponName: "RABBIT-31式短機関銃",
  cv: "藤田茜",
  portraitImage: "images/portrait/miyako.png",
  skills: {
    ex: "自走式閃光ドローン",
    normal: "クレイモア",
    passive: "特殊防弾プレート",
    sub: "攪乱作戦"
  },
  ...overrides,
});

const ALL_HINT_TYPES: HintType[] = [
  'school', 'club', 'age', 'birthday', 'height',
  'hobby', 'weaponName', 'cv', 'familyName',
];

describe('generateHints', () => {
  it('9種類のヒントがすべて生成される', () => {
    const student = makeStudent();
    const hints = generateHints(student);
    expect(hints).toHaveLength(9);

    const types = hints.map(h => h.type);
    for (const hintType of ALL_HINT_TYPES) {
      expect(types).toContain(hintType);
    }
  });

  it('各ヒントの値が正しくマッピングされている', () => {
    const student = makeStudent();
    const hints = generateHints(student);

    const byType = Object.fromEntries(hints.map(h => [h.type, h]));

    expect(byType.school.value).toBe('SRT特殊学園 / 1年生');
    expect(byType.club.value).toBe('RABBIT小隊');
    expect(byType.age.value).toBe('15歳');
    expect(byType.birthday.value).toBe('1月7日');
    expect(byType.height.value).toBe('156cm');
    expect(byType.hobby.value).toBe('動物系の動画鑑賞');
    expect(byType.weaponName.value).toBe('RABBIT-31式短機関銃');
    expect(byType.cv.value).toBe('藤田茜');
    expect(byType.familyName.value).toBe('月雪');
  });

  it('各ヒントにlabelが設定されている', () => {
    const hints = generateHints(makeStudent());
    for (const hint of hints) {
      expect(hint.label).toBeTruthy();
    }
  });
});

describe('createQuizQuestion', () => {
  it('生徒情報が正しく設定される', () => {
    const student = makeStudent();
    const question = createQuizQuestion(student);
    expect(question.student).toBe(student);
  });

  it('seedあり時にヒント順序が決定論的', () => {
    const student = makeStudent();
    const q1 = createQuizQuestion(student, 42);
    const q2 = createQuizQuestion(student, 42);
    expect(q1.hints.map(h => h.type)).toEqual(q2.hints.map(h => h.type));
  });

  it('異なるseedでは異なる順序になりうる', () => {
    const student = makeStudent();
    const q1 = createQuizQuestion(student, 1);
    const q2 = createQuizQuestion(student, 9999);
    // 同じ順序になる確率は非常に低い
    expect(q1.hints.map(h => h.type)).not.toEqual(q2.hints.map(h => h.type));
  });

  it('seedなしでも9つのヒントが含まれる', () => {
    const student = makeStudent();
    const question = createQuizQuestion(student);
    expect(question.hints).toHaveLength(9);
  });
});
