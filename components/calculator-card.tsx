"use client";

import Link from "next/link";
import { ChevronRight, ExternalLink, MousePointerClick } from "lucide-react";
import type { MouseEvent } from "react";

import { getCalculatorIcon } from "@/lib/icons";
import { calculatorCategories, type Calculator } from "@/lib/calculators";

type CalculatorCardProps = {
  calculator: Calculator;
  showCategoryBadge?: boolean;
  onOpenModal?: (calculator: Calculator) => void;
};

function pickModeLabel(displayMode: Calculator["displayMode"]): string {
  switch (displayMode) {
    case "embed":
      return "Embed";
    case "modal":
      return "Modal";
    case "external":
    default:
      return "Зовнішній";
  }
}

export function CalculatorCard({
  calculator,
  showCategoryBadge = false,
  onOpenModal,
}: CalculatorCardProps) {
  const Icon = getCalculatorIcon(calculator);
  const isExternal = calculator.displayMode === "external";
  const isModal = calculator.displayMode === "modal";
  const useCases = calculator.useCases.slice(0, 2);
  const categoryTitle = calculatorCategories.find(
    (category) => category.slug === calculator.mainCategory,
  )?.title;

  const editorialBadgeClass =
    calculator.editorialLabel === "Новий"
      ? "calc-card__badge calc-card__badge--new"
      : "calc-card__badge calc-card__badge--popular";

  const handleModalClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onOpenModal?.(calculator);
  };

  const cardBody = (
    <>
      <div className="calc-card__head">
        <span className="calc-card__icon" aria-hidden>
          <Icon size={20} />
        </span>
        <span className="calc-card__badges">
          {calculator.editorialLabel ? (
            <span className={editorialBadgeClass}>{calculator.editorialLabel}</span>
          ) : null}
          {showCategoryBadge && categoryTitle ? (
            <span className="calc-card__badge calc-card__badge--neutral">{categoryTitle}</span>
          ) : null}
        </span>
        <span className="calc-card__chevron" aria-hidden>
          {isModal ? <MousePointerClick size={18} /> : <ChevronRight size={18} />}
        </span>
      </div>

      <h3 className="calc-card__title">{calculator.title}</h3>
      <p className="calc-card__desc">{calculator.shortDescription}</p>

      {useCases.length > 0 ? (
        <ul className="calc-card__cases" aria-label={`Сценарії: ${calculator.title}`}>
          {useCases.map((useCase) => (
            <li key={useCase}>{useCase}</li>
          ))}
        </ul>
      ) : null}

      {calculator.tags && calculator.tags.length > 0 ? (
        <ul className="calc-card__tags" aria-label={`Теги: ${calculator.title}`}>
          {calculator.tags.slice(0, 3).map((tag) => (
            <li key={tag}>#{tag}</li>
          ))}
        </ul>
      ) : null}

      <p className="calc-card__meta">
        {isExternal ? <ExternalLink size={12} aria-hidden /> : null}
        <span className="calc-card__meta-mode">{pickModeLabel(calculator.displayMode)}</span>
        <span className="calc-card__meta-sep" aria-hidden>·</span>
        <span className="calc-card__meta-access">{calculator.accessLabel}</span>
      </p>
    </>
  );

  if (isModal && onOpenModal) {
    return (
      <button
        type="button"
        className="calc-card calc-card--modal"
        onClick={handleModalClick}
        aria-label={calculator.title}
      >
        {cardBody}
      </button>
    );
  }

  return (
    <Link
      href={`/calculator/${calculator.slug}`}
      className="calc-card"
      aria-label={calculator.title}
    >
      {cardBody}
    </Link>
  );
}
