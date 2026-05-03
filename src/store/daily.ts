import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { QuizKey } from "../quiz-core/key";

export interface DailyResult {
  key: QuizKey;
  studentId: string; // リプレイ時の整合性チェック用
  score: number;
  revealedHintCount: number;
  correct: boolean;
  timestamp: number;
}

export interface DailyProgress {
  key: QuizKey;
  revealedHintCount: number;
  // hints[] は保存しない。key から完全再生成可能
}

export const dailyResultsAtom = atomWithStorage<DailyResult[]>(
  "blue-archive-quiz-daily-results-v2",
  [],
);

export const dailyProgressAtom = atomWithStorage<DailyProgress | null>(
  "blue-archive-quiz-daily-progress-v2",
  null,
);

export const totalAttemptsAtom = atom((get) => get(dailyResultsAtom).length);

export const scoreDistributionAtom = atom((get) => {
  const results = get(dailyResultsAtom);
  return {
    zero: results.filter((r) => r.score === 0).length,
    low: results.filter((r) => r.score >= 1 && r.score <= 3).length,
    medium: results.filter((r) => r.score >= 4 && r.score <= 5).length,
    high: results.filter((r) => r.score >= 6 && r.score <= 7).length,
    veryHigh: results.filter((r) => r.score >= 8 && r.score <= 9).length,
    perfect: results.filter((r) => r.score === 10).length,
  };
});

export const bestScoreAtom = atom((get) =>
  Math.max(0, ...get(dailyResultsAtom).map((r) => r.score)),
);
