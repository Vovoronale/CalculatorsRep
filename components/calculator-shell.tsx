"use client";

import Link from "next/link";
import React, { useState } from "react";

import { CatalogRail } from "@/components/catalog-rail";
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

export function CalculatorShell({
  selectedCategory,
  selectedCalculator,
}: CalculatorShellProps) {
  const initialCategory =
    selectedCalculator?.mainCategory ??
    selectedCategory ??
    calculatorCategories[0].slug;

  const [currentCategory, setCurrentCategory] = useState<CalculatorCategory>(
    calculatorCategories.find((category) => category.slug === initialCategory) ??
      calculatorCategories[0],
  );
  const [currentCalculators, setCurrentCalculators] = useState<Calculator[]>(
    selectedCalculator ? [] : getCalculatorsForCategory(initialCategory),
  );

  const handleCategoryChange = (category: CalculatorCategory, calculators: Calculator[]) => {
    setCurrentCategory(category);
    setCurrentCalculators(calculators);
  };

  const isDetailMode = Boolean(selectedCalculator);

  return (
    <div className="site-shell">
      <CatalogRail
        initialCategory={initialCategory}
        selectedCalculator={selectedCalculator}
        syncWithHash={!selectedCategory && !selectedCalculator}
        onCategoryChange={handleCategoryChange}
      />

      <main className="site-workspace">
        {isDetailMode && selectedCalculator ? (
          <CalculatorDetail calculator={selectedCalculator} />
        ) : (
          <CatalogWorkspace category={currentCategory} calculators={currentCalculators} />
        )}

        <footer className="site-footer">
          <p>{siteContent.workspace.authorCtaDescription}</p>
          <div className="site-footer__links">
            {siteContent.navigation.utilityLinks
              .filter((link) => link.external)
              .map((link) => (
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

type CatalogWorkspaceProps = {
  category: CalculatorCategory;
  calculators: Calculator[];
};

function CatalogWorkspace({ category, calculators }: CatalogWorkspaceProps) {
  return (
    <>
      <section className="workspace-hero">
        <p className="workspace-hero__eyebrow">{siteContent.workspace.eyebrow}</p>
        <h1>{siteContent.workspace.title}</h1>
        <p className="workspace-hero__description">{siteContent.workspace.description}</p>
      </section>

      <section className="workspace-panel" aria-labelledby="workspace-category-heading">
        <div className="workspace-panel__header">
          <div>
            <p className="workspace-panel__label">{siteContent.workspace.categoryLabel}</p>
            <h2 id="workspace-category-heading">{category.title}</h2>
          </div>
          <p className="workspace-panel__note">{category.note}</p>
        </div>

        <div className="workspace-panel__list">
          {calculators.map((calculator) => (
            <Link
              key={calculator.slug}
              className="workspace-calculator"
              href={`/calculator/${calculator.slug}`}
              aria-label={calculator.title}
            >
              <div className="workspace-calculator__header">
                <h3>{calculator.title}</h3>
                {calculator.editorialLabel ? (
                  <span className="workspace-calculator__badge">{calculator.editorialLabel}</span>
                ) : null}
              </div>
              <p>{calculator.shortDescription}</p>
              <ul aria-label={`Сценарії: ${calculator.title}`}>
                {calculator.useCases.map((useCase) => (
                  <li key={useCase}>{useCase}</li>
                ))}
              </ul>
              <span>{siteContent.workspace.openCatalogItem}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="workspace-panel workspace-panel--compact" aria-labelledby="author-cta-heading">
        <p className="workspace-panel__label">{siteContent.workspace.authorCtaLabel}</p>
        <h2 id="author-cta-heading">{siteContent.workspace.authorCtaTitle}</h2>
        <p className="workspace-panel__description">{siteContent.workspace.authorCtaDescription}</p>
        <Link className="workspace-panel__cta" href="/author">
          Про автора
        </Link>
      </section>
    </>
  );
}

type CalculatorDetailProps = {
  calculator: Calculator;
};

function CalculatorDetail({ calculator }: CalculatorDetailProps) {
  return (
    <section className="workspace-panel workspace-panel--detail" aria-labelledby="detail-heading">
      <div className="workspace-panel__header workspace-panel__header--detail">
        <div>
          <p className="workspace-panel__label">{siteContent.workspace.detailLabel}</p>
          <h2 id="detail-heading">{calculator.title}</h2>
          <p className="workspace-panel__description">{calculator.shortDescription}</p>
        </div>
        <div className="workspace-panel__actions">
          <Link className="workspace-panel__link" href={`/#${calculator.mainCategory}`}>
            {siteContent.workspace.backToCatalog}
          </Link>
          <Link className="workspace-panel__cta" href={calculator.openUrl} target="_blank" rel="noreferrer">
            {siteContent.workspace.openStandalone}
          </Link>
        </div>
      </div>

      <ul className="workspace-use-cases" aria-label={`Сценарії: ${calculator.title}`}>
        {calculator.useCases.map((useCase) => (
          <li key={useCase}>{useCase}</li>
        ))}
      </ul>

      {calculator.embedMode === "embed" && calculator.embedUrl ? (
        <div className="workspace-embed">
          <iframe
            src={calculator.embedUrl}
            title={calculator.title}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : (
        <div className="workspace-external">
          <p>{siteContent.workspace.detailFallback}</p>
          <Link className="workspace-panel__cta" href={calculator.openUrl} target="_blank" rel="noreferrer">
            {siteContent.workspace.openStandalone}
          </Link>
        </div>
      )}
    </section>
  );
}
