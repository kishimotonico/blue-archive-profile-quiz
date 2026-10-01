import { describe, it, expect } from "vitest";
import {
  getTotalStages,
  getVisibleHintCount,
  getPortraitState,
  getRemainingStages,
  getNextStep,
  getRoundView,
} from "./reveal";
import { roundReducer } from "./round";
import type { Hint, QuizQuestion, Student } from "./types";
import type { RoundState } from "./round";

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

// hints.length=3 → 合計ステージは 4（ヒント3 + 立ち絵1）
const makeQuestion = (): QuizQuestion => ({
  student: makeStudent(),
  hints: makeHints(3),
  key: { version: 2, baseDate: "2026-04-21", seed: 1 },
});

const playingState = (revealedHintCount: number): RoundState => ({
  status: "playing",
  question: makeQuestion(),
  revealedHintCount,
});

const answeredState = (usedHintCount: number, correct = true): RoundState =>
  roundReducer(playingState(usedHintCount), {
    type: "submit",
    answer: correct ? "ミヤコ" : "アル",
    correct,
  });

describe("getTotalStages", () => {
  it("ヒント数 + 1（立ち絵）を返す", () => {
    expect(getTotalStages(playingState(1))).toBe(4);
  });
});

describe("getVisibleHintCount", () => {
  it("playing では revealedHintCount と hints.length の小さい方", () => {
    expect(getVisibleHintCount(playingState(2))).toBe(2);
    expect(getVisibleHintCount(playingState(4))).toBe(3); // 立ち絵段階でもヒントは全部まで
  });

  it("answered では常に hints.length（全ヒント表示）", () => {
    expect(getVisibleHintCount(answeredState(1))).toBe(3);
  });
});

describe("getPortraitState", () => {
  it("playing でヒント段階のうちは hidden", () => {
    expect(getPortraitState(playingState(3))).toBe("hidden");
  });

  it("playing でヒント数を超えると silhouette", () => {
    expect(getPortraitState(playingState(4))).toBe("silhouette");
  });

  it("answered では revealed", () => {
    expect(getPortraitState(answeredState(1))).toBe("revealed");
  });
});

describe("getRemainingStages", () => {
  it("playing では total - revealedHintCount", () => {
    expect(getRemainingStages(playingState(1))).toBe(3);
    expect(getRemainingStages(playingState(4))).toBe(0);
  });

  it("answered では 0", () => {
    expect(getRemainingStages(answeredState(1))).toBe(0);
  });
});

describe("getNextStep", () => {
  it("ヒントが残っていれば hint", () => {
    expect(getNextStep(playingState(1))).toBe("hint");
    expect(getNextStep(playingState(2))).toBe("hint");
  });

  it("開示数がヒント数と等しければ silhouette", () => {
    expect(getNextStep(playingState(3))).toBe("silhouette");
  });

  it("開示数がヒント数を超えていれば giveUp", () => {
    expect(getNextStep(playingState(4))).toBe("giveUp");
  });

  it("answered では null", () => {
    expect(getNextStep(answeredState(1))).toBeNull();
  });
});

describe("getRoundView", () => {
  it("playing では answered が false、correct/score は初期値", () => {
    const view = getRoundView(playingState(2));
    expect(view.student).toEqual(makeStudent());
    expect(view.answered).toBe(false);
    expect(view.correct).toBe(false);
    expect(view.score).toBe(0);
    expect(view.portraitState).toBe(getPortraitState(playingState(2)));
    expect(view.visibleHintCount).toBe(getVisibleHintCount(playingState(2)));
    expect(view.nextStep).toBe(getNextStep(playingState(2)));
  });

  it("answered では answered/correct/score が result から決まる", () => {
    const round = answeredState(1);
    const view = getRoundView(round);
    expect(view.answered).toBe(true);
    expect(view.correct).toBe(true);
    expect(view.score).toBeGreaterThan(0);
    expect(view.nextStep).toBeNull();
  });

  it("不正解の answered では correct が false", () => {
    const view = getRoundView(answeredState(1, false));
    expect(view.correct).toBe(false);
    expect(view.score).toBe(0);
  });
});
