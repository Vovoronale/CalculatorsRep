"use client";

import Link from "next/link";
import { ExternalLink, X } from "lucide-react";
import { useEffect, useRef } from "react";

import type { Calculator } from "@/lib/calculators";

type CalculatorModalProps = {
  calculator: Calculator | null;
  onClose: () => void;
};

export function CalculatorModal({ calculator, onClose }: CalculatorModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousActive = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!calculator) return;

    previousActive.current = document.activeElement as HTMLElement | null;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      previousActive.current?.focus?.();
    };
  }, [calculator, onClose]);

  if (!calculator) return null;

  const isEmbed = Boolean(calculator.embedUrl);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calculator-modal-title"
      onClick={onClose}
    >
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <header className="modal-card__header">
          <div className="modal-card__title-block">
            <p className="modal-card__eyebrow">{calculator.accessLabel}</p>
            <h2 id="calculator-modal-title" className="modal-card__title">
              {calculator.title}
            </h2>
          </div>
          <div className="modal-card__actions">
            <Link
              className="modal-card__action"
              href={`/calculator/${calculator.slug}`}
              onClick={onClose}
            >
              Відкрити сторінку
            </Link>
            <Link
              className="modal-card__action"
              href={calculator.openUrl}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={14} aria-hidden /> Окремо
            </Link>
            <button
              ref={closeRef}
              type="button"
              className="modal-card__close"
              onClick={onClose}
              aria-label="Закрити модальне вікно"
            >
              <X size={18} aria-hidden />
            </button>
          </div>
        </header>

        <div className="modal-card__body">
          {isEmbed && calculator.embedUrl ? (
            <iframe
              src={calculator.embedUrl}
              title={calculator.title}
              loading="eager"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="modal-card__external">
              <p>{calculator.description ?? calculator.shortDescription}</p>
              <Link
                className="cta-button"
                href={calculator.openUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={14} aria-hidden /> Перейти до інструмента
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
