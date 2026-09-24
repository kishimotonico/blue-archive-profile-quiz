import { describe, it, expect } from "vitest";
import { dailySessionReducer, type DailySession, type DailyState } from "./dailySession";
import { startRound } from "./round";
import type { Hint, QuizQuestion, Student } from "./types";

const makeStudent = (): Student => ({
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
});

const makeHints = (count: number): Hint[] =>
  Array.from({ length: count }, (_, i) => ({
    type: "school",
    label: `ヒント${i + 1}`,
    value: `値${i + 1}`,
  }));

const makeQuestion = (): QuizQuestion => ({
  student: makeStudent(),
  hints: makeHints(9),
  key: { version: 2, baseDate: "2026-04-21", seed: 1 },
});

const makeSession = (): DailySession => ({
  round: startRound(makeQuestion()),
  completedOnLoad: false,
});

describe("dailySessionReducer - round", () => {
  it("ready のときだけ roundReducer に委譲する", () => {
    const state: DailyState = { status: "ready", session: makeSession() };

    const next = dailySessionReducer(state, { type: "round", action: { type: "reveal" } });

    expect(next.status).toBe("ready");
    if (next.status !== "ready") throw new Error("unreachable");
    expect(next.session.round).toEqual({
      status: "playing",
      question: makeQuestion(),
      revealedHintCount: 2,
    });
  });

  it("ready 以外では同一参照を返す", () => {
    const loading: DailyState = { status: "loading" };
    const next = dailySessionReducer(loading, { type: "round", action: { type: "reveal" } });
    expect(next).toBe(loading);
  });

  it("roundReducer が同一参照を返せば state も同一参照を返す", () => {
    const session = makeSession();
    const answered: DailyState = {
      status: "ready",
      session: {
        ...session,
        round: { status: "answered", question: session.round.question, result: {
          studentId: session.round.question.student.id,
          usedHintCount: 1,
          correct: true,
          userAnswer: "ミヤコ",
          score: 10,
        } },
      },
    };

    // answered への reveal は roundReducer 側で no-op になる
    const next = dailySessionReducer(answered, { type: "round", action: { type: "reveal" } });

    expect(next).toBe(answered);
  });
});

describe("dailySessionReducer - loaded / failed", () => {
  it("loaded で ready になる", () => {
    const session = makeSession();
    const next = dailySessionReducer({ status: "loading" }, { type: "loaded", session });
    expect(next).toEqual({ status: "ready", session });
  });

  it("failed で error になる", () => {
    const next = dailySessionReducer({ status: "loading" }, { type: "failed" });
    expect(next).toEqual({ status: "error" });
  });
});
