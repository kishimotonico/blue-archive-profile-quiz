// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  loadRegularQuizProgress,
  saveRegularQuizProgress,
  clearRegularQuizProgress,
  REGULAR_QUIZ_PROGRESS_KEY,
  type RegularQuizProgress,
} from "./regular";
import { CURRENT_ALGORITHM_VERSION } from "../quiz-core";
import type { QuestionResult } from "../quiz-core";

const makeResult = (overrides: Partial<QuestionResult> = {}): QuestionResult => ({
  studentId: "s1",
  usedHintCount: 3,
  correct: true,
  userAnswer: "s1",
  score: 8,
  ...overrides,
});

const makeProgress = (overrides: Partial<RegularQuizProgress> = {}): RegularQuizProgress => ({
  schemaVersion: 3,
  masterKey: { version: CURRENT_ALGORITHM_VERSION, baseDate: "2026-04-21", seed: 12345 },
  results: [],
  round: { status: "playing", revealedHintCount: 1 },
  ...overrides,
});

describe("store/regular", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("保存した進捗をそのまま読み込める", () => {
    const progress = makeProgress({
      results: [makeResult(), makeResult({ studentId: "s2", score: 10 })],
      round: { status: "playing", revealedHintCount: 4 },
    });

    saveRegularQuizProgress(progress);

    expect(loadRegularQuizProgress()).toEqual(progress);
  });

  it("answered な round も読み込める", () => {
    const progress = makeProgress({
      results: [makeResult()],
      round: { status: "answered", result: makeResult({ studentId: "s2", score: 0 }) },
    });

    saveRegularQuizProgress(progress);

    expect(loadRegularQuizProgress()).toEqual(progress);
  });

  it("clearRegularQuizProgress で保存内容が消える", () => {
    saveRegularQuizProgress(makeProgress());
    clearRegularQuizProgress();

    expect(loadRegularQuizProgress()).toBeNull();
    expect(sessionStorage.getItem(REGULAR_QUIZ_PROGRESS_KEY)).toBeNull();
  });

  it("保存が無ければ null を返す", () => {
    expect(loadRegularQuizProgress()).toBeNull();
  });

  it("masterKey.version が CURRENT_ALGORITHM_VERSION と異なる進捗は破棄される", () => {
    const stale = makeProgress({ masterKey: { version: 999, baseDate: "2026-04-21", seed: 1 } });
    sessionStorage.setItem(REGULAR_QUIZ_PROGRESS_KEY, JSON.stringify(stale));

    expect(loadRegularQuizProgress()).toBeNull();
  });

  it("形が壊れた進捗は破棄される", () => {
    sessionStorage.setItem(
      REGULAR_QUIZ_PROGRESS_KEY,
      JSON.stringify({ garbage: "yes", masterKey: "not-an-object" }),
    );

    expect(loadRegularQuizProgress()).toBeNull();
  });

  it("不正な JSON でも例外を投げず null を返す", () => {
    sessionStorage.setItem(REGULAR_QUIZ_PROGRESS_KEY, "not-json");

    expect(() => loadRegularQuizProgress()).not.toThrow();
    expect(loadRegularQuizProgress()).toBeNull();
  });

  it("round.status が不正な値の進捗は破棄される", () => {
    const invalidRound = {
      ...makeProgress(),
      round: { status: "unknown", revealedHintCount: 1 },
    };
    sessionStorage.setItem(REGULAR_QUIZ_PROGRESS_KEY, JSON.stringify(invalidRound));

    expect(loadRegularQuizProgress()).toBeNull();
  });
});
