"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

import {
  calculatorCategories,
  getCalculatorsForCategory,
  type Calculator,
  type CalculatorCategory,
  type CategorySlug,
} from "@/lib/calculators";
import { siteContent } from "@/lib/site-content";

type CalculatorShellProps = {
  selectedCategory?: CategorySlug;
  selectedCalculator?: Calculator;
};

function resolveHashCategory() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawHash = window.location.hash.replace("#", "") as CategorySlug;
  return calculatorCategories.some((category) => category.slug === rawHash)
    ? rawHash
    : null;
}

export function CalculatorShell({
  selectedCategory,
  selectedCalculator,
}: CalculatorShellProps) {
  const initialCategory =
    selectedCalculator?.mainCategory ??
    selectedCategory ??
    calculatorCategories[0].slug;

  const [activeCategory, setActiveCategory] = useState<CategorySlug>(initialCategory);

  useEffect(() => {
    if (selectedCategory || selectedCalculator) {
      return;
    }

    const syncWithHash = () => {
      const hashCategory = resolveHashCategory();
      if (hashCategory) {
        setActiveCategory(hashCategory);
      }
    };

    syncWithHash();
    window.addEventListener("hashchange", syncWithHash);

    return () => window.removeEventListener("hashchange", syncWithHash);
  }, [selectedCalculator, selectedCategory]);

  const currentCategory =
    calculatorCategories.find((category) => category.slug === activeCategory) ??
    calculatorCategories[0];

  const currentCalculators = useMemo(
    () => getCalculatorsForCategory(currentCategory.slug),
    [currentCategory.slug],
  );

  const isDetailMode = Boolean(selectedCalculator);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar__brand">
          <p className="topbar__eyebrow">{siteContent.brand.authorName}</p>
          <Link className="brand-link" href="/">
            {siteContent.brand.productName}
          </Link>
        </div>
        <nav className="utility-nav" aria-label="Сервісна навігація">
          {siteContent.navigation.utilityLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noreferrer" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="workspace">
        <section className="workspace__intro">
          <p className="workspace__eyebrow">{siteContent.workspace.eyebrow}</p>
          <h1>{siteContent.workspace.title}</h1>
          <p className="workspace__description">{siteContent.workspace.description}</p>
        </section>

        <section className="category-rail" aria-labelledby="category-rail-heading">
          <div className="category-rail__header">
            <p className="panel-label">{siteContent.workspace.categoryLabel}</p>
            <p id="category-rail-heading">{siteContent.workspace.categoryHint}</p>
          </div>
          <div className="category-rail__list">
            {calculatorCategories.map((category) => (
              <CategoryAction
                key={category.slug}
                category={category}
                isActive={
                  (selectedCalculator && selectedCalculator.mainCategory === category.slug) ||
                  (!selectedCalculator && currentCategory.slug === category.slug)
                }
                onSelect={setActiveCategory}
                isLocked={Boolean(selectedCalculator)}
              />
            ))}
          </div>
        </section>

        {isDetailMode && selectedCalculator ? (
          <CalculatorDetail calculator={selectedCalculator} />
        ) : (
          <CatalogView
            categoryTitle={currentCategory.title}
            categoryNote={currentCategory.note}
            calculators={currentCalculators}
          />
        )}

        <footer className="footer-note">
          <p>{siteContent.footer.note}</p>
          <div className="footer-note__links">
            {siteContent.navigation.utilityLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noreferrer" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </footer>
      </main>
    </div>
  );
}

type CategoryActionProps = {
  category: CalculatorCategory;
  isActive: boolean;
  onSelect: (categorySlug: CategorySlug) => void;
  isLocked: boolean;
};

function CategoryAction({ category, isActive, onSelect, isLocked }: CategoryActionProps) {
  if (isLocked) {
    return (
      <Link
        className={`category-chip${isActive ? " is-active" : ""}`}
        href={`/#${category.slug}`}
        aria-label={category.title}
      >
        <span>{category.title}</span>
        <small>{category.note}</small>
      </Link>
    );
  }

  return (
    <button
      className={`category-chip${isActive ? " is-active" : ""}`}
      type="button"
      aria-label={category.title}
      aria-pressed={isActive}
      onClick={() => {
        window.history.replaceState(null, "", `#${category.slug}`);
        onSelect(category.slug);
      }}
    >
      <span>{category.title}</span>
      <small>{category.note}</small>
    </button>
  );
}

type CatalogViewProps = {
  categoryTitle: string;
  categoryNote: string;
  calculators: Calculator[];
};

function CatalogView({ categoryTitle, categoryNote, calculators }: CatalogViewProps) {
  return (
    <section className="catalog-panel" aria-labelledby="catalog-heading">
      <div className="catalog-panel__header">
        <p className="panel-label">{siteContent.workspace.catalogLabel}</p>
        <div>
          <h2 id="catalog-heading">{categoryTitle}</h2>
          <p>{categoryNote}</p>
        </div>
      </div>

      <div className="calculator-list">
        {calculators.map((calculator) => (
          <Link
            key={calculator.slug}
            className="calculator-strip"
            href={`/calculator/${calculator.slug}`}
            aria-label={calculator.title}
          >
            <div className="calculator-strip__copy">
              <div className="calculator-strip__title-row">
                <h3>{calculator.title}</h3>
                {calculator.editorialLabel ? (
                  <span className="editorial-pill">{calculator.editorialLabel}</span>
                ) : null}
              </div>
              <p>{calculator.shortDescription}</p>
            </div>
            <ul className="calculator-strip__tags" aria-label={`Сценарії: ${calculator.title}`}>
              {calculator.useCases.map((useCase) => (
                <li key={useCase}>{useCase}</li>
              ))}
            </ul>
            <span className="calculator-strip__action">{siteContent.workspace.openCatalogItem}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

type CalculatorDetailProps = {
  calculator: Calculator;
};

function CalculatorDetail({ calculator }: CalculatorDetailProps) {
  return (
    <section className="detail-panel" aria-labelledby="detail-heading">
      <div className="detail-panel__header">
        <div>
          <p className="panel-label">{siteContent.workspace.detailLabel}</p>
          <h2 id="detail-heading">{calculator.title}</h2>
          <p>{calculator.shortDescription}</p>
        </div>
        <div className="detail-panel__actions">
          <Link className="ghost-link" href={`/#${calculator.mainCategory}`}>
            {siteContent.workspace.backToCatalog}
          </Link>
          <Link className="cta-link" href={calculator.openUrl} target="_blank" rel="noreferrer">
            {siteContent.workspace.openStandalone}
          </Link>
        </div>
      </div>

      <ul className="use-case-list" aria-label={`Сценарії: ${calculator.title}`}>
        {calculator.useCases.map((useCase) => (
          <li key={useCase}>{useCase}</li>
        ))}
      </ul>

      {calculator.embedMode === "embed" && calculator.embedUrl ? (
        <div className="embed-frame">
          <iframe
            src={calculator.embedUrl}
            title={calculator.title}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : (
        <div className="external-panel">
          <p>{siteContent.workspace.detailFallback}</p>
          <Link className="cta-link" href={calculator.openUrl} target="_blank" rel="noreferrer">
            {siteContent.workspace.openStandalone}
          </Link>
        </div>
      )}
    </section>
  );
}
