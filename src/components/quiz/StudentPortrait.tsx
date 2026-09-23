import { useState } from "react";
import type { Student, PortraitState } from "../../quiz-core";
import Modal from "../common/Modal";
import { getPortraitImageUrl, NO_IMAGE_URL } from "./portraitImageUrl";

interface StudentPortraitProps {
  student: Student | null;
  state: PortraitState;
  /** 回答済みのとき、正解だったかどうか。バッジの文言に使う */
  correct?: boolean;
}

/**
 * デスクトップ右カラムの立ち絵カード。
 * 立ち絵は縦長なので、通常はバストアップに切り取って大きく見せ、
 * 全身は「全身を見る」モーダルで確認できるようにしている。
 */
function StudentPortrait({ student, state, correct = false }: StudentPortraitProps) {
  const [showFullBody, setShowFullBody] = useState(false);
  const revealed = state === "revealed";
  const hidden = state === "hidden";

  const imageStateClass = revealed
    ? "opacity-100"
    : "opacity-50 brightness-0 pointer-events-none select-none";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-ba-border bg-white">
      {/* バストアップ表示枠 */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-linear-to-b from-ba-sky-1 to-white">
        {student && !hidden ? (
          <img
            src={getPortraitImageUrl(student)}
            alt={revealed ? student.fullName : "シルエット"}
            draggable={false}
            className={`absolute inset-0 h-full w-full object-cover object-top transition-all duration-500 ${imageStateClass}`}
            onError={(e) => {
              e.currentTarget.src = NO_IMAGE_URL;
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl font-light text-ba-blue/40">?</span>
          </div>
        )}

        {/* 下端を白へ溶かして名前欄と繋ぐ */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-b from-transparent to-white/90"
          aria-hidden="true"
        />

        {revealed && (
          <span className="absolute bottom-2 left-3 rounded-full bg-ba-blue px-3 py-1 text-xs font-bold text-white">
            {correct ? "CORRECT!" : "ANSWER"}
          </span>
        )}
      </div>

      {/* 生徒名 + 全身表示。hiddenの間も高さを確保するため常に描画し、invisible で隠す
          （行ごと消すと立ち絵の表示枠の高さが変わってしまうため） */}
      <div
        className={`flex shrink-0 items-center justify-between gap-2 border-t border-ba-border px-3 py-2 ${
          hidden ? "invisible" : ""
        }`}
        aria-hidden={hidden || undefined}
      >
        <span
          className={`min-w-0 truncate font-display font-black ${
            revealed ? "text-ba-navy" : "tracking-[0.24em] text-ba-ink-soft/70"
          }`}
        >
          {revealed && student ? student.fullName : "？？？"}
        </span>
        <button
          type="button"
          onClick={() => setShowFullBody(true)}
          disabled={!student || hidden}
          tabIndex={hidden ? -1 : undefined}
          className="shrink-0 rounded-full border border-ba-sky-2 bg-ba-sky-1 px-3 py-1 text-xs font-bold text-ba-blue transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ba-blue disabled:opacity-40"
        >
          全身を見る
        </button>
      </div>

      {student && (
        <Modal
          isOpen={showFullBody}
          onClose={() => setShowFullBody(false)}
          title={revealed ? student.fullName : "シルエット"}
        >
          <img
            src={getPortraitImageUrl(student)}
            alt={revealed ? student.fullName : "シルエット"}
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
