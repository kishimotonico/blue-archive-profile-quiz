import { atom } from "jotai";
import { parseStudents, type StudentEntry } from "../quiz-core";

// fetch と JSON→Student 変換はこの atom だけが持つ。quiz-core はデータ取得経路を知らない
// 純粋な生徒配列を受け取るだけにする。
export const allStudentsAtom = atom(async () => {
  const response = await fetch(`${import.meta.env.BASE_URL}data/students.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch students.json: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as Record<string, StudentEntry>;
  return parseStudents(data);
});
