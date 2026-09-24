import { describe, it, expect } from "vitest";
import { regularSessionReducer, type RegularSession, type RegularState } from "./regularSession";
import { startRound, roundReducer, type RoundState } from "./round";
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

const makeQuestion = (student: Student, seed: number): QuizQuestion => ({
  student,
  hints: makeHints(9),
  key: { version: 2, baseDate: "2026-04-21", seed },
});

const makeSession = (questions: QuizQuestion[], index = 0): RegularSession => ({
  masterKey: { version: 2, baseDate: "2026-04-21", seed: 0 },
  questions,
  index,
  results: [],
  round: startRound(questions[index]),
});

const answer = (round: RoundState): RoundState =>
  roundReducer(round, { type: "submit", answer: "ミヤコ", correct: true });

describe("regularSessionReducer - next", () => {
  it("次の問題があれば results に追加して index を進める", () => {
    const q0 = makeQuestion(makeStudent(), 1);
    const q1 = makeQuestion(makeStudent({ id: "aru", fullName: "陸八魔アル", name: "アル" }), 2);
    const session = makeSession([q0, q1]);
    const answered: RegularState = {
      status: "ready",
      session: { ...session, round: answer(session.round) },
    };

    const next = regularSessionReducer(answered, { type: "next" });

    expect(next.status).toBe("ready");
    if (next.status !== "ready") throw new Error("unreachable");
    expect(next.session.results).toHaveLength(1);
    expect(next.session.index).toBe(1);
    expect(next.session.round).toEqual({ status: "playing", question: q1, revealedHintCount: 1 });
  });

  it("最後の問題なら results に追加して finished になり、questions.length 件になる", () => {
    const q0 = makeQuestion(makeStudent(), 1);
    const session = makeSession([q0]);
    const answered: RegularState = {
      status: "ready",
      session: { ...session, round: answer(session.round) },
    };

    const next = regularSessionReducer(answered, { type: "next" });

    expect(next.status).toBe("finished");
    if (next.status !== "finished") throw new Error("unreachable");
    expect(next.session.results).toHaveLength(1);
  });

  it("同じ生徒が2問続いても、次の round は playing・revealedHintCount=1 で始まる", () => {
    const student = makeStudent();
    const q0 = makeQuestion(student, 1);
    const q1 = makeQuestion(student, 2);
    const session = makeSession([q0, q1]);
    const answered: RegularState = {
      status: "ready",
      session: { ...session, round: answer(session.round) },
    };

    const next = regularSessionReducer(answered, { type: "next" });

    expect(next.status).toBe("ready");
    if (next.status !== "ready") throw new Error("unreachable");
    expect(next.session.round).toEqual({ status: "playing", question: q1, revealedHintCount: 1 });
  });

  it("playing 中の next は同一参照を返す", () => {
    const q0 = makeQuestion(makeStudent(), 1);
    const state: RegularState = { status: "ready", session: makeSession([q0]) };

    const next = regularSessionReducer(state, { type: "next" });

    expect(next).toBe(state);
  });

  it("finished 後の next は同一参照を返す", () => {
    const q0 = makeQuestion(makeStudent(), 1);
    const session = makeSession([q0]);
    const readyAnswered: RegularState = {
      status: "ready",
      session: { ...session, round: answer(session.round) },
    };
    const finished = regularSessionReducer(readyAnswered, { type: "next" });

    const next = regularSessionReducer(finished, { type: "next" });

    expect(next).toBe(finished);
  });
});

describe("regularSessionReducer - round", () => {
  it("ready のときだけ roundReducer に委譲する", () => {
    const q0 = makeQuestion(makeStudent(), 1);
    const state: RegularState = { status: "ready", session: makeSession([q0]) };

    const next = regularSessionReducer(state, { type: "round", action: { type: "reveal" } });

    expect(next.status).toBe("ready");
    if (next.status !== "ready") throw new Error("unreachable");
    expect(next.session.round).toEqual({ status: "playing", question: q0, revealedHintCount: 2 });
  });

  it("ready 以外では同一参照を返す", () => {
    const loading: RegularState = { status: "loading" };
    const next = regularSessionReducer(loading, { type: "round", action: { type: "reveal" } });
    expect(next).toBe(loading);
  });

  it("roundReducer が同一参照を返せば state も同一参照を返す", () => {
    const q0 = makeQuestion(makeStudent(), 1);
    const session = makeSession([q0]);
    const answered: RegularState = {
      status: "ready",
      session: { ...session, round: answer(session.round) },
    };

    // answered への reveal は roundReducer 側で no-op になる
    const next = regularSessionReducer(answered, { type: "round", action: { type: "reveal" } });

    expect(next).toBe(answered);
  });
});
