"use client";

import { useEffect } from "react";

type DrawerBackdropProps = {
  open: boolean;
  onClose: () => void;
};

export function DrawerBackdrop({ open, onClose }: DrawerBackdropProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div
      className="drawer-backdrop"
      data-open={open ? "true" : "false"}
      aria-hidden={!open}
      onClick={onClose}
    />
  );
}
