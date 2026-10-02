import { useState } from "react";
import type { Student, PortraitState } from "../../quiz-core";
import Modal from "../common/Modal";
import { getPortraitImageUrl, NO_IMAGE_URL } from "./portraitImageUrl";

interface StudentPortraitProps {
  student: Student;
  state: PortraitState;
  /** 回答後のバッジの文言（正解／答え）の出し分け */
  correct: boolean;
}

// 立ち絵は縦長なので、通常はバストアップに切り取って大きく見せる
function StudentPortrait({ student, state, correct }: StudentPortraitProps) {
  const [showFullBody, setShowFullBody] = useState(false);
  const revealed = state === "revealed";
  const hidden = state === "hidden";
  const imageAlt = revealed ? student.fullName : "シルエット";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-ba-border bg-white">
      <div className="relative min-h-0 flex-1 overflow-hidden bg-linear-to-b from-ba-sky-1 to-white">
        {hidden ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl font-light text-ba-blue/40">?</span>
          </div>
        ) : (
          <img
            src={getPortraitImageUrl(student)}
            alt={imageAlt}
            draggable={false}
            className={`absolute inset-0 h-full w-full object-cover object-top transition-[opacity,filter] duration-500 motion-reduce:transition-none starting:opacity-0 ${
              revealed ? "opacity-100" : "opacity-50 brightness-0 pointer-events-none select-none"
            }`}
            onError={(e) => {
              e.currentTarget.src = NO_IMAGE_URL;
            }}
          />
        )}

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-b from-transparent to-white/90"
          aria-hidden="true"
        />

        {revealed && (
          <span className="absolute bottom-2 left-3 rounded-full bg-ba-blue px-3 py-1 text-xs font-bold text-white">
            {correct ? "正解" : "答え"}
          </span>
        )}
      </div>

      {/* hidden でも invisible で残す。消すと立ち絵枠の高さが変わり、立ち絵の位置が動く */}
      <div
        className={`flex shrink-0 items-center justify-between gap-2 border-t border-ba-border px-3 py-2 ${
          hidden ? "invisible" : ""
        }`}
      >
        <span
          className={`min-w-0 truncate font-display font-black ${
            revealed ? "text-ba-navy" : "tracking-[0.24em] text-ba-ink-soft/70"
          }`}
        >
          {revealed ? student.fullName : "？？？"}
        </span>
        <button
          type="button"
          onClick={() => setShowFullBody(true)}
          className="shrink-0 rounded-full border border-ba-sky-2 bg-ba-sky-1 px-3 py-1 text-xs font-bold text-ba-blue transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ba-blue"
        >
          全身を見る
        </button>
      </div>

      {!hidden && (
        <Modal isOpen={showFullBody} onClose={() => setShowFullBody(false)} title={imageAlt}>
          <img
            src={getPortraitImageUrl(student)}
            alt={imageAlt}
            draggable={false}
            className={`mx-auto max-h-[60dvh] w-auto object-contain ${revealed ? "" : "brightness-0 opacity-60"}`}
            onError={(e) => {
              e.currentTarget.src = NO_IMAGE_URL;
            }}
          />
        </Modal>
      )}
    </div>
  );
}

export default StudentPortrait;
