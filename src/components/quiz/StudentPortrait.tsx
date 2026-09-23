import type { Student, PortraitState } from "../../quiz-core";
import { getPortraitImageUrl, NO_IMAGE_URL } from "./portraitImageUrl";

interface StudentPortraitProps {
  student: Student | null;
  state: PortraitState;
  variant?: "default" | "sidebar";
}

function StudentPortrait({ student, state, variant = "default" }: StudentPortraitProps) {
  const isSidebar = variant === "sidebar";

  return (
    <div
      className={
        isSidebar ? "relative w-full h-full flex items-center justify-center" : "relative w-56 h-64"
      }
    >
      {/* ?マーク（hidden時に表示） */}
      <div
        className={`absolute inset-0 flex items-center justify-center rounded-2xl border border-dashed border-ba-sky-2 bg-linear-to-b from-ba-sky-1 to-white transition-opacity duration-500 ${
          state === "hidden" ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <span className={`${isSidebar ? "text-6xl" : "text-7xl"} font-light text-ba-blue/40`}>?</span>
      </div>

      {/* 立ち絵（silhouette/revealed時に表示） */}
      {student && state !== "hidden" && (
        <img
          src={getPortraitImageUrl(student)}
          alt={state === "revealed" ? student.fullName : "シルエット"}
          draggable={false}
          className={`absolute inset-0 h-full w-auto mx-auto select-none object-contain rounded-2xl shadow-lg transition-all duration-500 ${
            state === "silhouette" ? "opacity-50 brightness-0 pointer-events-none" : "opacity-100"
          }`}
          onError={(e) => {
            e.currentTarget.src = NO_IMAGE_URL;
          }}
        />
      )}
    </div>
  );
}

export default StudentPortrait;
