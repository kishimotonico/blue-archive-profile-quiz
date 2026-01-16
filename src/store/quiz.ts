import { atom } from 'jotai';
import type { QuizQuestion, QuizState, Student } from '../quiz-core';

/**
 * 全生徒リスト
 */
export const allStudentsAtom = atom<Student[]>([]);

/**
 * 現在のクイズ問題
 */
export const currentQuestionAtom = atom<QuizQuestion | null>(null);

/**
 * 開示済みヒント数
 */
export const revealedHintCountAtom = atom(0);

/**
 * 回答済みフラグ
 */
export const answeredAtom = atom(false);

/**
 * 正解フラグ
 */
export const correctAtom = atom(false);

/**
 * 現在のスコア
 */
export const scoreAtom = atom(0);

/**
 * クイズ状態を取得する派生atom
 */
export const quizStateAtom = atom<QuizState | null>((get) => {
  const question = get(currentQuestionAtom);
  if (!question) return null;

  return {
    question,
    revealedHintCount: get(revealedHintCountAtom),
    answered: get(answeredAtom),
    correct: get(correctAtom),
    score: get(scoreAtom),
  };
});
