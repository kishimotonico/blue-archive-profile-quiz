import { atom } from 'jotai';
import type { QuizQuestion, Student } from '../quiz-core';

/**
 * 全生徒リスト
 */
export const allStudentsAtom = atom<Student[]>([]);

/**
 * 現在のクイズ問題
 */
export const currentQuestionAtom = atom<QuizQuestion | null>(null);

/**
 * 開示済みヒント数（最初から1つヒントを表示）
 */
export const revealedHintCountAtom = atom(1);

/**
 * 回答済みフラグ
 */
export const answeredAtom = atom(false);

/**
 * 正解フラグ
 */
export const correctAtom = atom(false);

/**
 * 現在のスコア（1ヒントで正解時の点数）
 */
export const scoreAtom = atom(10);


