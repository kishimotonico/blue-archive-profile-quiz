import type { Student } from '../../quiz-core';

type PortraitState = 'hidden' | 'silhouette' | 'revealed';

interface StudentPortraitProps {
  student: Student | null;
  state: PortraitState;
}

function StudentPortrait({ student, state }: StudentPortraitProps) {
  if (state === 'hidden' || !student) {
    return (
      <div className="w-56 h-64 bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300">
        <span className="text-7xl text-gray-400 font-light">?</span>
      </div>
    );
  }

  const imageClass =
    state === 'silhouette'
      ? 'brightness-0 opacity-50'
      : 'opacity-100 transition-opacity duration-700';

  return (
    <div className="flex items-center justify-center">
      <img
        src={`/data/images/portraits/${student.id}.png`}
        alt={state === 'silhouette' ? 'シルエット' : student.fullName}
        className={`h-64 w-auto rounded-2xl shadow-lg ${imageClass}`}
        onError={(e) => {
          e.currentTarget.src = 'https://via.placeholder.com/256x256?text=No+Image';
        }}
      />
    </div>
  );
}

export default StudentPortrait;
