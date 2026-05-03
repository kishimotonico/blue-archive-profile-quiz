import type { Student, Hint, HintType } from "./types";
import { extractFamilyName } from "./students";
import { shuffleV1 } from "./random";

const HINT_LABELS: Record<HintType, string> = {
  school: "学園",
  club: "部活",
  age: "年齢",
  birthday: "誕生日",
  height: "身長",
  hobby: "趣味",
  weaponName: "武器",
  cv: "CV",
  familyName: "姓",
};

export function generateHintsV1(student: Student, seed: number): Hint[] {
  const hints: Hint[] = [
    { type: "school", label: HINT_LABELS.school, value: `${student.school} / ${student.grade}` },
    { type: "club", label: HINT_LABELS.club, value: student.club },
    { type: "age", label: HINT_LABELS.age, value: student.age },
    { type: "birthday", label: HINT_LABELS.birthday, value: student.birthday },
    { type: "height", label: HINT_LABELS.height, value: student.height },
    { type: "hobby", label: HINT_LABELS.hobby, value: student.hobby },
    { type: "weaponName", label: HINT_LABELS.weaponName, value: student.weaponName },
    { type: "cv", label: HINT_LABELS.cv, value: student.cv },
    {
      type: "familyName",
      label: HINT_LABELS.familyName,
      value: extractFamilyName(student.fullName),
    },
  ];
  return shuffleV1([...hints], seed);
}
