"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
export default function Dialog({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.showModal();
    const close = () => onClose();
    element.addEventListener("close", close);
    return () => element.removeEventListener("close", close);
  }, [onClose]);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      className="dash-native-dialog"
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
    >
      <div className="dash-popup-title">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="dash-small dash-muted">{subtitle}</p>}
        </div>
        <button
          type="button"
          className="dash-icon-btn"
          aria-label="Close dialog"
          onClick={() => ref.current?.close()}
        >
          <X size={17} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
