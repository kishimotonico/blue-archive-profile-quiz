import { describe, it, expect } from "vitest";
import {
  startRound,
  restoreRound,
  toRoundSnapshot,
  roundReducer,
  judgeSubmit,
  type RoundState,
} from "./round";
import type { Hint, QuizQuestion, Student } from "./types";

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

const makeHints = (count: number): Hint[] =>
  Array.from({ length: count }, (_, i) => ({
    type: "school",
    label: `ヒント${i + 1}`,
    value: `値${i + 1}`,
  }));

const makeQuestion = (hintCount = 9): QuizQuestion => ({
  student: makeStudent(),
  hints: makeHints(hintCount),
  key: { version: 2, baseDate: "2026-04-21", seed: 1 },
});

const otherStudent = makeStudent({ id: "aru", fullName: "陸八魔アル", name: "アル" });

describe("startRound", () => {
  it("playing, revealedHintCount=1 で始まる", () => {
    const question = makeQuestion();
    expect(startRound(question)).toEqual({
      status: "playing",
      question,
      revealedHintCount: 1,
    });
  });
});

describe("roundReducer - reveal", () => {
  it("playing かつ上限未満なら +1 する", () => {
    const state = startRound(makeQuestion(9));
    const next = roundReducer(state, { type: "reveal" });
    expect(next).toEqual({ ...state, revealedHintCount: 2 });
  });

  it("上限（hints.length + 1）に達すると同じ参照を返す", () => {
    const question = makeQuestion(2);
    const state: RoundState = { status: "playing", question, revealedHintCount: 3 };
    const next = roundReducer(state, { type: "reveal" });
    expect(next).toBe(state);
  });

  it("answered では同じ参照を返す", () => {
    const question = makeQuestion();
    const playing: RoundState = { status: "playing", question, revealedHintCount: 1 };
    const answered = roundReducer(playing, { type: "submit", answer: "ミヤコ", correct: true });
    const next = roundReducer(answered, { type: "reveal" });
    expect(next).toBe(answered);
  });
});

describe("roundReducer - submit / giveUp", () => {
  it("submit で answered になり、score・usedHintCount・userAnswer が正しい", () => {
    const question = makeQuestion(9);
    const state: RoundState = { status: "playing", question, revealedHintCount: 3 };
    const next = roundReducer(state, { type: "submit", answer: "ミヤコ", correct: true });
    expect(next).toEqual({
      status: "answered",
      question,
      result: {
        studentId: question.student.id,
        usedHintCount: 3,
        correct: true,
        userAnswer: "ミヤコ",
        score: 8,
      },
    });
  });

  it("giveUp で answered になり、score=0・userAnswer=null になる", () => {
    const question = makeQuestion(9);
    const state: RoundState = { status: "playing", question, revealedHintCount: 5 };
    const next = roundReducer(state, { type: "giveUp" });
    expect(next).toEqual({
      status: "answered",
      question,
      result: {
        studentId: question.student.id,
        usedHintCount: 5,
        correct: false,
        userAnswer: null,
        score: 0,
      },
    });
  });

  it("answered への二重 submit は同じ参照を返す", () => {
    const question = makeQuestion();
    const playing: RoundState = { status: "playing", question, revealedHintCount: 1 };
    const answered = roundReducer(playing, { type: "submit", answer: "ミヤコ", correct: true });
    const next = roundReducer(answered, { type: "submit", answer: "アル", correct: false });
    expect(next).toBe(answered);
  });

  it("answered への二重 giveUp は同じ参照を返す", () => {
    const question = makeQuestion();
    const playing: RoundState = { status: "playing", question, revealedHintCount: 1 };
    const answered = roundReducer(playing, { type: "giveUp" });
    const next = roundReducer(answered, { type: "giveUp" });
    expect(next).toBe(answered);
  });
});

describe("toRoundSnapshot / restoreRound", () => {
  it("playing の往復で状態が戻る", () => {
    const question = makeQuestion();
    const state: RoundState = { status: "playing", question, revealedHintCount: 4 };
    const snapshot = toRoundSnapshot(state);
    expect(restoreRound(question, snapshot)).toEqual(state);
  });

  it("1ヒントで正解した10点の結果を復元しても score=10 / usedHintCount=1 のまま", () => {
    const question = makeQuestion();
    const playing: RoundState = { status: "playing", question, revealedHintCount: 1 };
    const answered = roundReducer(playing, { type: "submit", answer: "ミヤコ", correct: true });
    const snapshot = toRoundSnapshot(answered);
    const restored = restoreRound(question, snapshot);

    expect(restored).toEqual(answered);
    if (restored.status === "answered") {
      expect(restored.result.score).toBe(10);
      expect(restored.result.usedHintCount).toBe(1);
    }
  });
});

describe("judgeSubmit", () => {
  const allStudents = [makeStudent(), otherStudent];

  it("正解なら correct", () => {
    const state = startRound(makeQuestion());
    expect(judgeSubmit(state, "ミヤコ", allStudents)).toEqual({ type: "correct" });
  });

  it("実在する別の生徒なら wrong", () => {
    const state = startRound(makeQuestion());
    expect(judgeSubmit(state, "アル", allStudents)).toEqual({ type: "wrong" });
  });

  it("実在しない生徒名なら unknownStudent", () => {
    const state = startRound(makeQuestion());
    expect(judgeSubmit(state, "存在しない生徒", allStudents)).toEqual({ type: "unknownStudent" });
  });

  it("answered 中の submit は ignored", () => {
    const question = makeQuestion();
    const playing: RoundState = { status: "playing", question, revealedHintCount: 1 };
    const answered = roundReducer(playing, { type: "submit", answer: "ミヤコ", correct: true });
    expect(judgeSubmit(answered, "ミヤコ", allStudents)).toEqual({ type: "ignored" });
  });
});
