import { atom } from "jotai";
import type { QuizQuestion } from "../quiz-core";

// store/students.ts への移動後方互換のための re-export。
// 既存の import 元をここに残しているだけで、C の担当（controller 接続）で消す。
export { allStudentsAtom } from "./students";

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

/**
 * 確定した最終回答テキスト。
 * correct / wrong_student 判定時のみセットし、unknown（継続）やギブアップでは触らない。
 * resetQuiz() でnullにリセットされる。
 */
export const lastConfirmedAnswerAtom = atom<string | null>(null);
