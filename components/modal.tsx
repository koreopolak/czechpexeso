"use client";

/**
 * Accessible modal built on the native <dialog> element: focus trapping,
 * Escape to close and the backdrop come from the browser.
 */
import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { useT } from "@/components/providers";

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
  dismissible?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const t = useT();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself, outside the panel).
        if (dismissible && e.target === ref.current) onClose();
      }}
      className={`m-auto w-[calc(100%-2rem)] ${wide ? "max-w-xl" : "max-w-md"} max-h-[calc(100dvh-2rem)] overflow-visible rounded-3xl bg-transparent p-0 text-fg backdrop:bg-black/45 backdrop:backdrop-blur-[2px]`}
    >
      {open && (
        <div className="rise relative max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl border border-line bg-bg p-6 shadow-soft sm:p-8">
          {dismissible && (
            <button type="button" onClick={onClose} className="btn btn-ghost btn-icon absolute right-3 top-3" aria-label={t("common.close")}>
              <Icon name="close" size={18} />
            </button>
          )}
          {children}
        </div>
      )}
    </dialog>
  );
}
