import type { QuizKey } from "./key";

export interface Student {
  id: string;
  fullName: string;
  name: string;
  school: string;
  grade: string | null; // 学年に加えて中退・停学中などの例外値も許容する
  club: string;
  age: string;
  birthday: string;
  height: string;
  hobby: string;
  weaponName: string;
  cv: string;
  portraitImage: string;
  skills: {
    ex: string;
    normal: string;
    passive: string;
    sub: string;
  };
  availableFrom: string | null; // ISO YYYY-MM-DD: クイズで出題対象になった日。null の場合は出題対象外
}

export type HintType =
  | "school"
  | "club"
  | "age"
  | "birthday"
  | "height"
  | "hobby"
  | "weaponName"
  | "cv"
  | "familyName";

export interface Hint {
  type: HintType;
  label: string;
  value: string;
}

export interface QuizQuestion {
  student: Student;
  hints: Hint[];
  key: QuizKey;
}

export type PortraitState = "hidden" | "silhouette" | "revealed";

export interface QuizState {
  question: QuizQuestion;
  revealedHintCount: number;
  answered: boolean;
  correct: boolean;
  score: number;
}
