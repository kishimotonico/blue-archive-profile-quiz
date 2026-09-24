import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { registerDialogOpen } from "./dialogRegistry";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** titleが無いときにアクセシブルネームとして使う */
  ariaLabel?: string;
  children: ReactNode;
  /**
   * 開いた時点でフォーカスの退避先が無かった（activeElementがbodyなど）場合に、
   * 閉じた際のフォーカス復帰先として使う
   */
  focusFallbackRef?: RefObject<HTMLElement | null>;
}

function Modal({ isOpen, onClose, title, ariaLabel, children, focusFallbackRef }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);

  // レンダリング中の代入を避け、コミット後にonCloseの最新値を反映する
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // フォーカスの退避・復帰。呼び出し側がonCloseにインライン関数を渡すことが多く、
  // 依存にonCloseを含めると親の再レンダリングのたびに退避・復帰が往復してしまうため、
  // isOpenの変化だけに反応させる
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement && document.activeElement !== document.body
        ? document.activeElement
        : null;
    closeButtonRef.current?.focus();
    const fallback = focusFallbackRef?.current ?? null;

    return () => {
      const restoreTarget = previouslyFocused ?? fallback;
      restoreTarget?.focus();
    };
  }, [isOpen, focusFallbackRef]);

  // 他のModalが同時に開いているかを外部から購読できるよう登録する。
  useEffect(() => {
    if (!isOpen) return;
    return registerDialogOpen();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const dialogEl = dialogRef.current;
      if (!dialogEl) return;

      // モーダル外へフォーカスが漏れないようTab/Shift+Tabを先頭/末尾でラップする
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
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel}
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

        {/* 閉じるボタンが長い内容と一緒にスクロールして見えなくならないよう、中身だけをスクロールさせる */}
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
