import type { Student } from "../../quiz-core";

interface StudentRevealProps {
  student: Student;
  correct: boolean;
  score: number;
}

function StudentReveal({ student, correct, score }: StudentRevealProps) {
  return (
    <div className="py-2 text-center">
      <div
        className={`font-display text-lg font-black ${correct ? "text-ba-blue" : "text-red-500"}`}
      >
        {correct ? "正解！" : "不正解..."}
        <span className="ml-2 inline-flex items-baseline gap-1 rounded-full border border-ba-yellow/60 bg-linear-to-b from-yellow-100 to-ba-yellow/70 px-3 py-0.5 align-middle text-ba-navy">
          <span className="text-base">{score}</span>
          <span className="text-xs font-bold">点</span>
        </span>
      </div>
      <div className="mt-1 font-display text-xl font-black text-ba-navy">{student.fullName}</div>
    </div>
  );
}

export default StudentReveal;
