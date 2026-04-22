"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

import {
  calculatorCategories,
  getCalculatorsForCategory,
  type Calculator,
  type CategorySlug,
} from "@/lib/calculators";
import { projectCategories } from "@/lib/projects";
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
        <div>
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

      <div className="shell__body">
        <aside className="sidebar" aria-label="Категорії калькуляторів">
          <p className="sidebar__label">Категорії</p>
          <div className="sidebar__stack">
            {calculatorCategories.map((category) => {
              const isActive =
                (selectedCalculator && selectedCalculator.mainCategory === category.slug) ||
                (!selectedCalculator && currentCategory.slug === category.slug);

              if (selectedCalculator) {
                return (
                  <Link
                    key={category.slug}
                    className={`sidebar__item${isActive ? " is-active" : ""}`}
                    href={`/#${category.slug}`}
                  >
                    <span>{category.title}</span>
                    <small>{category.note}</small>
                  </Link>
                );
              }

              return (
                <button
                  key={category.slug}
                  className={`sidebar__item${isActive ? " is-active" : ""}`}
                  type="button"
                  onClick={() => {
                    window.history.replaceState(null, "", `#${category.slug}`);
                    setActiveCategory(category.slug);
                  }}
                >
                  <span>{category.title}</span>
                  <small>{category.note}</small>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="workspace">
          <section className="workspace__intro">
            <p className="workspace__eyebrow">{siteContent.workspace.eyebrow}</p>
            <h1>{siteContent.workspace.title}</h1>
            <p className="workspace__description">{siteContent.workspace.description}</p>
            <p className="workspace__release">{siteContent.workspace.releaseLabel}</p>
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

          <ProjectsView />

          <footer className="footer-note" id="author-note">
            <p className="footer-note__label">{siteContent.authorTeaser.label}</p>
            <h2>{siteContent.authorTeaser.title}</h2>
            <p>{siteContent.authorTeaser.description}</p>
            <Link className="cta-link" href="/author">
              {siteContent.authorTeaser.cta}
            </Link>
          </footer>
        </main>
      </div>
    </div>
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
        <h2 id="catalog-heading">{categoryTitle}</h2>
        <p>{categoryNote}</p>
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

function ProjectsView() {
  return (
    <section className="projects-panel" aria-labelledby="projects-heading">
      <div className="projects-panel__header">
        <p className="panel-label">{siteContent.projects.label}</p>
        <h2 id="projects-heading">{siteContent.projects.title}</h2>
        <p>{siteContent.projects.description}</p>
      </div>

      <div className="project-categories">
        {projectCategories.map((category) => (
          <section
            key={category.slug}
            className="project-category"
            aria-labelledby={`project-category-${category.slug}`}
          >
            <div className="project-category__header">
              <h3 id={`project-category-${category.slug}`}>{category.title}</h3>
              <p>{category.description}</p>
            </div>
            <div className="project-list">
              {category.projects.map((project) => (
                <Link
                  key={project.slug}
                  className="project-row"
                  href={project.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={project.title}
                >
                  <div className="project-row__copy">
                    <h4>{project.title}</h4>
                    <p>{project.description}</p>
                  </div>
                  <span className="project-row__cta">{siteContent.projects.openProject}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
