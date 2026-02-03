import type { Student } from '../../quiz-core';

interface StudentRevealProps {
  student: Student;
  correct: boolean;
  score: number;
}

function StudentReveal({ student, correct, score }: StudentRevealProps) {
  return (
    <div className="text-center py-2">
      <div className={`text-lg font-bold ${correct ? 'text-green-600' : 'text-red-500'}`}>
        {correct ? '正解！' : '不正解...'}
        <span className="ml-2 text-blue-600">{score}点</span>
      </div>
      <div className="text-xl font-bold text-gray-800 mt-1">{student.fullName}</div>
    </div>
  );
}

export default StudentReveal;
