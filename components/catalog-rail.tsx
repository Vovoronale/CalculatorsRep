"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, User, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { SearchInput } from "@/components/search-input";
import { getCategoryIcon } from "@/lib/icons";
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
};

function resolveHashCategory(): CategorySlug | null {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.replace("#", "") as CategorySlug;
  return calculatorCategories.some((c) => c.slug === raw) ? raw : null;
}

export function CatalogRail({
  initialCategory,
  selectedCalculator,
  syncWithHash = false,
  onCategoryChange,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}: CatalogRailProps) {
  const [activeCategory, setActiveCategory] = useState<CategorySlug>(
    selectedCalculator?.mainCategory ?? initialCategory ?? calculatorCategories[0].slug,
  );

  useEffect(() => {
    if (!syncWithHash || selectedCalculator) return;

    const sync = () => {
      const hashCat = resolveHashCategory();
      if (hashCat) setActiveCategory(hashCat);
    };

    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [selectedCalculator, syncWithHash]);

  const currentCategory =
    calculatorCategories.find((c) => c.slug === activeCategory) ??
    calculatorCategories[0];

  const currentCalculators = useMemo(
    () => getCalculatorsForCategory(currentCategory.slug),
    [currentCategory.slug],
  );

  useEffect(() => {
    onCategoryChange?.(currentCategory, currentCalculators);
  }, [currentCalculators, currentCategory, onCategoryChange]);

  const handleSelect = (slug: CategorySlug) => {
    if (syncWithHash) {
      window.history.replaceState(null, "", `#${slug}`);
    }
    setActiveCategory(slug);
  };

  return (
    <aside
      className="catalog-rail"
      aria-label="Каталог калькуляторів"
      data-mobile-open={isMobileOpen ? "true" : "false"}
    >
      <div className="catalog-rail__brand-block">
        <Link href="/" className="catalog-rail__brand">
          <span className="catalog-rail__brand-eyebrow">{siteContent.brand.authorName}</span>
          <span>{siteContent.brand.subBrandName}</span>
        </Link>
        {onCloseMobile ? (
          <button
            type="button"
            className="catalog-rail__close"
            onClick={onCloseMobile}
            aria-label="Закрити каталог"
          >
            <X size={18} aria-hidden />
          </button>
        ) : null}
        {onToggleCollapse ? (
          <button
            type="button"
            className="catalog-rail__collapse"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Розгорнути каталог" : "Згорнути каталог"}
            title={isCollapsed ? "Розгорнути" : "Згорнути"}
          >
            {isCollapsed ? (
              <ChevronRight size={16} aria-hidden />
            ) : (
              <ChevronLeft size={16} aria-hidden />
            )}
          </button>
        ) : null}
      </div>

      <SearchInput onResultClick={onCloseMobile} />

      <section className="catalog-rail__section" aria-labelledby="catalog-rail-categories">
        <p className="catalog-rail__section-label" id="catalog-rail-categories">
          {siteContent.workspace.railLabel}
        </p>
        {calculatorCategories.map((category) => (
          <CategoryAction
            key={category.slug}
            category={category}
            isActive={currentCategory.slug === category.slug}
            isLocked={Boolean(selectedCalculator)}
            onSelect={(slug) => {
              handleSelect(slug);
              onCloseMobile?.();
            }}
          />
        ))}
      </section>

      <section className="catalog-rail__section" aria-labelledby="catalog-rail-calculators">
        <p className="catalog-rail__section-label" id="catalog-rail-calculators">
          {currentCategory.title}
        </p>
        <div className="catalog-rail__calculator-list">
          {currentCalculators.map((calculator) => {
            const isCurrent = selectedCalculator?.slug === calculator.slug;
            return (
              <Link
                key={calculator.slug}
                href={`/calculator/${calculator.slug}`}
                className={`catalog-rail__calculator-link${isCurrent ? " is-current" : ""}`}
                aria-label={calculator.title}
                aria-current={isCurrent ? "page" : undefined}
                onClick={onCloseMobile}
              >
                <span>{calculator.title}</span>
                {calculator.editorialLabel ? (
                  <span className="catalog-rail__calc-badge">{calculator.editorialLabel}</span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </section>

      <div className="catalog-rail__footer">
        <Link href="/author" className="catalog-rail__footer-link">
          <User size={14} aria-hidden />
          <span>Про автора</span>
        </Link>
      </div>
    </aside>
  );
}

type CategoryActionProps = {
  category: CalculatorCategory;
  isActive: boolean;
  isLocked: boolean;
  onSelect: (slug: CategorySlug) => void;
};

function CategoryAction({ category, isActive, isLocked, onSelect }: CategoryActionProps) {
  const Icon = getCategoryIcon(category.slug);
  const className = `catalog-rail__category${isActive ? " is-active" : ""}`;

  const content = (
    <>
      <span className="catalog-rail__category-icon" aria-hidden>
        <Icon size={16} />
      </span>
      <span className="catalog-rail__category-text">{category.title}</span>
    </>
  );

  if (isLocked) {
    return (
      <Link
        className={className}
        href={`/#${category.slug}`}
        aria-label={category.title}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      className={className}
      type="button"
      aria-pressed={isActive}
      aria-label={category.title}
      onClick={() => onSelect(category.slug)}
    >
      {content}
    </button>
  );
}
