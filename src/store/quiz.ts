import { atom } from "jotai";
import type { QuizQuestion } from "../quiz-core";
import { loadStudents } from "../quiz-core";

/**
 * 全生徒リスト（Suspense 対応の async atom）。
 * loadStudents() のモジュールキャッシュにより 2 回目以降は即時解決する。
 */
export const allStudentsAtom = atom(async () => loadStudents());

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
