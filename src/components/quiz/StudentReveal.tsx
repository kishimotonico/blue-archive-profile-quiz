import type { Student } from '../../quiz-core';

interface StudentRevealProps {
  student: Student;
  correct: boolean;
}

function StudentReveal({ student, correct }: StudentRevealProps) {
  return (
    <div className="text-center py-2">
      <div className={`text-lg font-bold ${correct ? 'text-green-600' : 'text-red-500'}`}>
        {correct ? '正解！' : '不正解...'}
      </div>
      <div className="text-xl font-bold text-gray-800 mt-1">{student.fullName}</div>
    </div>
  );
}

export default StudentReveal;
