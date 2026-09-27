import { useEffect, useId, useRef, type ReactNode } from "react";

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

  // 開閉はdialogのopen属性を見て判断し、既に同じ状態ならshowModal/closeを呼ばない
  // （closeイベント経由でonCloseが呼ばれた後、親のisOpen更新でこのeffectが再度closeを
  // 呼ぶような二重呼び出しを避けるため）
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
      // 背景の mousedown でフォーカスが body に移ると、close() 時にブラウザが開く前の要素へ
      // フォーカスを戻さなくなるため、背景では既定のフォーカス移動を止める
      onMouseDown={(e) => {
        if (e.target === dialogRef.current) e.preventDefault();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      // flex を常に付けると UA の dialog:not([open]) { display: none } に勝ち、閉じても表示されるため open のときだけにする
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

            <div>{children}</div>
          </div>
        </>
      )}
    </dialog>
  );
}

export default Modal;
