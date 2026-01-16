export interface Student {
  id: string;
  fullName: string;       // 陸八魔アル
  name: string;           // アル
  school: string;
  grade: string;          // 2年生
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
}

export type HintType =
  | 'school'
  | 'club'
  | 'age'
  | 'birthday'
  | 'height'
  | 'hobby'
  | 'weaponName'
  | 'cv'
  | 'familyName';

export interface Hint {
  type: HintType;
  label: string;          // 表示用ラベル
  value: string;          // ヒント値
}

export interface QuizQuestion {
  student: Student;
  hints: Hint[];          // シャッフル済み
}

export interface QuizState {
  question: QuizQuestion;
  revealedHintCount: number;
  answered: boolean;
  correct: boolean;
  score: number;
}
