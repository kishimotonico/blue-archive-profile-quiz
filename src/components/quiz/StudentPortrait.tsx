import type { Student, PortraitState } from '../../quiz-core';

interface StudentPortraitProps {
  student: Student | null;
  state: PortraitState;
  variant?: 'default' | 'sidebar';
}

function StudentPortrait({ student, state, variant = 'default' }: StudentPortraitProps) {
  const isSidebar = variant === 'sidebar';

  return (
    <div
      className={
        isSidebar
          ? 'relative w-full h-full flex items-center justify-center'
          : 'relative w-56 h-64'
      }
    >
      {/* ?マーク（hidden時に表示） */}
      <div
        className={`absolute inset-0 bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300 transition-opacity duration-500 ${
          state === 'hidden' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <span className={`${isSidebar ? 'text-6xl' : 'text-7xl'} text-gray-400 font-light`}>?</span>
      </div>

      {/* 立ち絵（silhouette/revealed時に表示） */}
      {student && state !== 'hidden' && (
        <img
          src={`${import.meta.env.BASE_URL}data/images/portraits/${student.id}.png`}
          alt={state === 'revealed' ? student.fullName : 'シルエット'}
          draggable={false}
          className={`absolute inset-0 h-full w-auto mx-auto object-contain rounded-2xl shadow-lg transition-all duration-500 select-none ${
            state === 'silhouette'
              ? 'opacity-50 brightness-0 pointer-events-none'
              : 'opacity-100'
          }`}
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/256x256?text=No+Image';
          }}
        />
      )}
    </div>
  );
}

export default StudentPortrait;
