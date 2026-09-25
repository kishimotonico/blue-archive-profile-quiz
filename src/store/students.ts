import { atom } from "jotai";
import { loadStudents } from "../quiz-core";

export const allStudentsAtom = atom(async () => loadStudents());
