import type { Student } from '../../quiz-core';

type PortraitState = 'hidden' | 'silhouette' | 'revealed';

interface StudentPortraitProps {
  student: Student | null;
  state: PortraitState;
}

function StudentPortrait({ student, state }: StudentPortraitProps) {
  if (state === 'hidden' || !student) {
    return (
      <div className="flex items-center justify-center w-64 h-64 bg-gray-200 rounded-lg">
        <div className="text-8xl text-gray-400">?</div>
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
        className={`max-h-80 w-auto rounded-lg ${imageClass}`}
        onError={(e) => {
          e.currentTarget.src = 'https://via.placeholder.com/256x256?text=No+Image';
        }}
      />
    </div>
  );
}

export default StudentPortrait;
