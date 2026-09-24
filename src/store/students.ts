import { atom } from "jotai";
import { loadStudents } from "../quiz-core";

/**
 * 全生徒リスト（Suspense 対応の async atom）。
 * loadStudents() のモジュールキャッシュにより 2 回目以降は即時解決する。
 */
export const allStudentsAtom = atom(async () => loadStudents());
