import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** titleが無いときにアクセシブルネームとして使う */
  ariaLabel?: string;
  children: ReactNode;
}

function Modal({ isOpen, onClose, title, ariaLabel, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // Escape などで dialog が先に閉じた後、親の isOpen 更新で close() を二重に呼ばないよう open 属性で判定する
  useEffect(() => {
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    if (isOpen && !dialogEl.open) {
      dialogEl.showModal();
    } else if (!isOpen && dialogEl.open) {
      dialogEl.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : ariaLabel}
      onClose={onClose}
      // 背景の mousedown でフォーカスが body に移ると、close() で開く前の要素にフォーカスが戻らなくなる
      onMouseDown={(e) => {
        if (e.target === dialogRef.current) e.preventDefault();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      // flex を常に付けると UA の display: none に勝って閉じても表示されるため、open: を付ける
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md open:flex flex-col overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-black/50"
    >
      {isOpen && (
        <>
          <button
            type="button"
            aria-label="閉じる"
            onClick={() => dialogRef.current?.close()}
            className="absolute top-1.5 right-1.5 z-10 p-2.5 rounded-lg text-ba-ink-soft hover:text-ba-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ba-blue"
          >
            <X className="w-6 h-6" />
          </button>

          {/* 閉じるボタンがスクロールで隠れないよう、中身だけをスクロールさせる */}
          <div className="overflow-y-auto p-6">
            {title && (
              <h2 id={titleId} className="font-display text-2xl font-black mb-4 text-ba-navy">
                {title}
              </h2>
            )}

            {children}
          </div>
        </>
      )}
    </dialog>
  );
}

export default Modal;
