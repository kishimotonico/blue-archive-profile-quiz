import { describe, it, expect } from "vitest";
import { hiraganaToKatakana, normalizeAnswer, checkAnswer, validateAnswer } from "./answer";
import type { Student } from "./types";

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
    sub: "攪乱作戦",
  },
  ...overrides,
});

describe("hiraganaToKatakana", () => {
  it("ひらがなをカタカナに変換する", () => {
    expect(hiraganaToKatakana("あいうえお")).toBe("アイウエオ");
  });

  it("カタカナはそのまま", () => {
    expect(hiraganaToKatakana("アイウエオ")).toBe("アイウエオ");
  });

  it("漢字はそのまま", () => {
    expect(hiraganaToKatakana("陸八魔")).toBe("陸八魔");
  });

  it("混合文字列", () => {
    expect(hiraganaToKatakana("陸八魔ある")).toBe("陸八魔アル");
  });

  it("空文字列", () => {
    expect(hiraganaToKatakana("")).toBe("");
  });
});

describe("normalizeAnswer", () => {
  it("空白を除去する", () => {
    expect(normalizeAnswer("陸八魔 アル")).toBe("陸八魔アル");
  });

  it("英字を小文字化する", () => {
    expect(normalizeAnswer("ABC")).toBe("abc");
  });

  it("ひらがなをカタカナに変換する", () => {
    expect(normalizeAnswer("あるいは")).toBe("アルイハ");
  });

  it("全角スペースも除去する", () => {
    expect(normalizeAnswer("陸八魔　アル")).toBe("陸八魔アル");
  });

  it("組み合わせ", () => {
    expect(normalizeAnswer("  あいう  ABC  ")).toBe("アイウabc");
  });
});

describe("checkAnswer", () => {
  const student = makeStudent();

  it("フルネームで正解", () => {
    expect(checkAnswer("月雪ミヤコ", student)).toBe(true);
  });

  it("名前のみで正解", () => {
    expect(checkAnswer("ミヤコ", student)).toBe(true);
  });

  it("ひらがなで正解（フルネーム）", () => {
    expect(checkAnswer("つきゆきみやこ", student)).toBe(false); // 漢字+カタカナなので不一致
  });

  it("名前をひらがなで入力", () => {
    expect(checkAnswer("みやこ", student)).toBe(true); // ひらがな→カタカナ変換で一致
  });

  it("間違った名前は不正解", () => {
    expect(checkAnswer("ホシノ", student)).toBe(false);
  });

  it("空文字は不正解", () => {
    expect(checkAnswer("", student)).toBe(false);
  });

  it("スペース入りでも正解（フルネーム）", () => {
    expect(checkAnswer("月雪 ミヤコ", student)).toBe(true);
  });
});

describe("validateAnswer", () => {
  const correctStudent = makeStudent();
  const otherStudent = makeStudent({ id: "hoshino", name: "ホシノ", fullName: "小鳥遊ホシノ" });
  const allStudents = [correctStudent, otherStudent];

  it("正解の場合: correct", () => {
    const result = validateAnswer("ミヤコ", correctStudent, allStudents);
    expect(result.type).toBe("correct");
  });

  it("存在する生徒だが不正解: wrong_student", () => {
    const result = validateAnswer("ホシノ", correctStudent, allStudents);
    expect(result.type).toBe("wrong_student");
    if (result.type === "wrong_student") {
      expect(result.answeredStudent.id).toBe("hoshino");
    }
  });

  it("存在しない生徒: unknown", () => {
    const result = validateAnswer("ユメ", correctStudent, allStudents);
    expect(result.type).toBe("unknown");
  });
});
