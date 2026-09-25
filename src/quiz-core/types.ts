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

export interface QuestionResult {
  studentId: string;
  usedHintCount: number; // 回答確定時点の開示数。1〜10。10は立ち絵まで開示
  correct: boolean;
  userAnswer: string | null; // 確定提出時の回答テキスト。ギブアップ/未提出はnull
  score: number;
}

// QuestionResult のうち userAnswer だけ欠落を許す。欠落は「未記録」で、旧バージョンから取り込んだ記録にだけ現れる。
// Omit で導くのは、QuestionResult に optional の項目を足したとき記録側の型を触らずに済むようにするため
export type RecordedResult = Omit<QuestionResult, "userAnswer"> & { userAnswer?: string | null };

export interface QuestionRecord {
  key: QuizKey;
  result: RecordedResult;
  playedAt: number; // 回答を確定した時刻（epoch ms）
}
