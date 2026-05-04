import { describe, it, expect } from "vitest";
import { generateHintsV1 } from "./hints";
import type { Student, HintType } from "./types";

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
  availableFrom: "2026-04-21",
  skills: {
    ex: "自走式閃光ドローン",
    normal: "クレイモア",
    passive: "特殊防弾プレート",
    sub: "攪乱作戦",
  },
  ...overrides,
});

const ALL_HINT_TYPES: HintType[] = [
  "school",
  "club",
  "age",
  "birthday",
  "height",
  "hobby",
  "weaponName",
  "cv",
  "familyName",
];

describe("generateHintsV1", () => {
  it("9種類のヒントがすべて生成される", () => {
    const hints = generateHintsV1(makeStudent(), 42);
    expect(hints).toHaveLength(9);

    const types = hints.map((h) => h.type);
    for (const hintType of ALL_HINT_TYPES) {
      expect(types).toContain(hintType);
    }
  });

  it("各ヒントの値が正しくマッピングされている", () => {
    const hints = generateHintsV1(makeStudent(), 42);
    const byType = Object.fromEntries(hints.map((h) => [h.type, h]));

    expect(byType.school.value).toBe("SRT特殊学園 / 1年生");
    expect(byType.club.value).toBe("RABBIT小隊");
    expect(byType.age.value).toBe("15歳");
    expect(byType.birthday.value).toBe("1月7日");
    expect(byType.height.value).toBe("156cm");
    expect(byType.hobby.value).toBe("動物系の動画鑑賞");
    expect(byType.weaponName.value).toBe("RABBIT-31式短機関銃");
    expect(byType.cv.value).toBe("藤田茜");
    expect(byType.familyName.value).toBe("月雪");
  });

  it("例外的な grade の値もそのまま表示できる", () => {
    const hints = generateHintsV1(
      makeStudent({
        school: "トリニティ総合学園",
        grade: "中退",
      }),
      42,
    );
    const byType = Object.fromEntries(hints.map((h) => [h.type, h]));

    expect(byType.school.value).toBe("トリニティ総合学園 / 中退");
  });

  it("各ヒントにlabelが設定されている", () => {
    const hints = generateHintsV1(makeStudent(), 42);
    for (const hint of hints) {
      expect(hint.label).toBeTruthy();
    }
  });

  it("同じseedで同じ順序を返す（再現性）", () => {
    const student = makeStudent();
    const h1 = generateHintsV1(student, 42);
    const h2 = generateHintsV1(student, 42);
    expect(h1.map((h) => h.type)).toEqual(h2.map((h) => h.type));
  });

  it("異なるseedでは異なる順序になりうる", () => {
    const student = makeStudent();
    const h1 = generateHintsV1(student, 1);
    const h2 = generateHintsV1(student, 9999);
    expect(h1.map((h) => h.type)).not.toEqual(h2.map((h) => h.type));
  });
});
