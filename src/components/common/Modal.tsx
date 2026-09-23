import { useEffect, useId, useRef, type ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    // 閉じたときにフォーカスを開いた元の要素へ戻す
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const dialogEl = dialogRef.current;
      if (!dialogEl) return;

      // モーダル内のフォーカス可能要素の先頭/末尾でTab/Shift+Tabをラップする簡易フォーカストラップ
      const focusable = dialogEl.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* モーダルコンテンツ */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className="relative flex flex-col bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[calc(100dvh-2rem)] overflow-hidden"
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="閉じる"
          onClick={onClose}
          className="absolute top-1.5 right-1.5 z-10 p-2.5 rounded-lg text-ba-ink-soft hover:text-ba-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ba-blue"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* 中身のみスクロール（装飾・閉じるボタンは固定） */}
        <div className="overflow-y-auto p-6">
          {title && (
            <h2 id={titleId} className="font-display text-2xl font-black mb-4 text-ba-navy">
              {title}
            </h2>
          )}

          <div className="mb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default Modal;
