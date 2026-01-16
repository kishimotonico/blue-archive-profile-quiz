import type { Student } from '../../quiz-core';

interface StudentRevealProps {
  student: Student;
  correct: boolean;
}

function StudentReveal({ student, correct }: StudentRevealProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div
        className={`text-center mb-4 ${
          correct ? 'text-green-600' : 'text-red-600'
        }`}
      >
        <div className="text-2xl font-bold">
          {correct ? '正解!' : '不正解...'}
        </div>
      </div>

      <div className="flex flex-col items-center">
        <img
          src={`/blue-archive-profile-quiz/data/${student.portraitImage}`}
          alt={student.fullName}
          className="w-64 h-auto mb-4 rounded-lg"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/256x256?text=No+Image';
          }}
        />

        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          {student.fullName}
        </h2>

        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          <div className="text-sm">
            <span className="text-gray-600">所属:</span>{' '}
            <span className="font-semibold">{student.school}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">部活:</span>{' '}
            <span className="font-semibold">{student.club}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">年齢:</span>{' '}
            <span className="font-semibold">{student.age}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">誕生日:</span>{' '}
            <span className="font-semibold">{student.birthday}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">CV:</span>{' '}
            <span className="font-semibold">{student.cv}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentReveal;
