import type { Student } from "../../quiz-core";

interface StudentRevealProps {
  student: Student;
  correct: boolean;
  score: number;
  /**
   * 生徒名を表示するかどうか。デスクトップでは立ち絵パネルの名前行と重複するため false にする。
   * モバイルは立ち絵に名前行が無いため true のまま使う。
   */
  showName?: boolean;
}

function StudentReveal({ student, correct, score, showName = true }: StudentRevealProps) {
  return (
    <div className="py-2 text-center">
      <div
        className={`font-display text-lg font-black ${correct ? "text-ba-correct" : "text-ba-wrong"}`}
      >
        {correct ? "正解！" : "不正解..."}
        <span className="ml-2 inline-flex items-baseline gap-1 rounded-full border border-ba-yellow-soft bg-linear-to-b from-ba-yellow-soft/40 to-ba-yellow/60 px-3 py-0.5 align-middle text-ba-navy">
          <span className="text-base">{score}</span>
          <span className="text-xs font-bold">点</span>
        </span>
      </div>
      {showName && (
        <div className="mt-1 font-display text-xl font-black text-ba-navy">{student.fullName}</div>
      )}
    </div>
  );
}

export default StudentReveal;
