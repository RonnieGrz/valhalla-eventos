import type { ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
}

export function Modal({ title, onClose, children, widthClass = "max-w-md" }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className={`w-full ${widthClass} max-h-[90vh] overflow-y-auto rounded-xl border border-gridline bg-surface-1 p-5 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-gridline pb-4">
          <h2 className="font-display text-lg font-semibold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="-mr-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-surface-2 hover:text-text-primary"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
