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

type CatalogRailProps = {
  initialCategory?: CategorySlug;
  selectedCalculator?: Calculator;
  syncWithHash?: boolean;
  onCategoryChange?: (category: CalculatorCategory, calculators: Calculator[]) => void;
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

export function CatalogRail({
  initialCategory,
  selectedCalculator,
  syncWithHash = false,
  onCategoryChange,
}: CatalogRailProps) {
  const [activeCategory, setActiveCategory] = useState<CategorySlug>(
    selectedCalculator?.mainCategory ?? initialCategory ?? calculatorCategories[0].slug,
  );

  useEffect(() => {
    if (!syncWithHash || selectedCalculator) {
      return;
    }

    const syncFromHash = () => {
      const hashCategory = resolveHashCategory();

      if (hashCategory) {
        setActiveCategory(hashCategory);
      }
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);

    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [selectedCalculator, syncWithHash]);

  const currentCategory =
    calculatorCategories.find((category) => category.slug === activeCategory) ??
    calculatorCategories[0];

  const currentCalculators = useMemo(
    () => getCalculatorsForCategory(currentCategory.slug),
    [currentCategory.slug],
  );

  useEffect(() => {
    onCategoryChange?.(currentCategory, currentCalculators);
  }, [currentCalculators, currentCategory, onCategoryChange]);

  const handleSelect = (categorySlug: CategorySlug) => {
    if (syncWithHash) {
      window.history.replaceState(null, "", `#${categorySlug}`);
    }

    setActiveCategory(categorySlug);
  };

  return (
    <aside className="catalog-rail" aria-label="Каталог калькуляторів">
      <div className="catalog-rail__brand-block">
        <p className="catalog-rail__eyebrow">{siteContent.brand.authorName}</p>
        <Link className="catalog-rail__brand" href="/">
          {siteContent.brand.productName}
        </Link>
        <p className="catalog-rail__summary">{siteContent.workspace.railDescription}</p>
      </div>

      <nav className="catalog-rail__nav" aria-label="Сервісна навігація">
        {siteContent.navigation.utilityLinks.map((link) => (
          <Link
            key={link.label}
            className="catalog-rail__nav-link"
            href={link.href}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noreferrer" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <section className="catalog-rail__section" aria-labelledby="catalog-rail-categories">
        <div className="catalog-rail__section-header">
          <p className="catalog-rail__section-label">{siteContent.workspace.railLabel}</p>
          <p id="catalog-rail-categories" className="catalog-rail__section-note">
            {siteContent.workspace.categoryHint}
          </p>
        </div>
        <div className="catalog-rail__category-list">
          {calculatorCategories.map((category) => (
            <CategoryAction
              key={category.slug}
              category={category}
              isActive={currentCategory.slug === category.slug}
              isLocked={Boolean(selectedCalculator)}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </section>

      <section className="catalog-rail__section" aria-labelledby="catalog-rail-calculators">
        <div className="catalog-rail__section-header">
          <p className="catalog-rail__section-label">{currentCategory.title}</p>
          <p id="catalog-rail-calculators" className="catalog-rail__section-note">
            {currentCategory.note}
          </p>
        </div>
        <div className="catalog-rail__calculator-list">
          {currentCalculators.map((calculator) => {
            const isCurrent = selectedCalculator?.slug === calculator.slug;

            return (
              <Link
                key={calculator.slug}
                className={`catalog-rail__calculator-link${isCurrent ? " is-current" : ""}`}
                href={`/calculator/${calculator.slug}`}
                aria-label={calculator.title}
                aria-current={isCurrent ? "page" : undefined}
              >
                <span>{calculator.title}</span>
                <small>{calculator.shortDescription}</small>
              </Link>
            );
          })}
        </div>
      </section>
    </aside>
  );
}

type CategoryActionProps = {
  category: CalculatorCategory;
  isActive: boolean;
  isLocked: boolean;
  onSelect: (categorySlug: CategorySlug) => void;
};

function CategoryAction({ category, isActive, isLocked, onSelect }: CategoryActionProps) {
  if (isLocked) {
    return (
      <Link
        className={`catalog-rail__category${isActive ? " is-active" : ""}`}
        href={`/#${category.slug}`}
      >
        <span>{category.title}</span>
        <small>{category.note}</small>
      </Link>
    );
  }

  return (
    <button
      className={`catalog-rail__category${isActive ? " is-active" : ""}`}
      type="button"
      aria-pressed={isActive}
      aria-label={category.title}
      onClick={() => onSelect(category.slug)}
    >
      <span>{category.title}</span>
      <small>{category.note}</small>
    </button>
  );
}
