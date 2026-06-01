"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, User, X } from "lucide-react";
import type { MouseEvent } from "react";

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
  selectedCalculator?: Calculator;
  activeCategory?: CategorySlug;
  onSelectCategory?: (slug: CategorySlug) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
};

export function CatalogRail({
  selectedCalculator,
  activeCategory,
  onSelectCategory,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}: CatalogRailProps) {
  const currentCategory = selectedCalculator?.mainCategory ?? activeCategory;

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
        <div className="rail-tree">
          {calculatorCategories.map((category) => (
            <CategoryLink
              key={category.slug}
              category={category}
              isCurrent={currentCategory === category.slug}
              isCollapsed={isCollapsed}
              onSelectCategory={onSelectCategory}
              onCloseMobile={onCloseMobile}
            />
          ))}
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

type CategoryLinkProps = {
  category: CalculatorCategory;
  isCurrent: boolean;
  isCollapsed: boolean;
  onSelectCategory?: (slug: CategorySlug) => void;
  onCloseMobile?: () => void;
};

function CategoryLink({
  category,
  isCurrent,
  isCollapsed,
  onSelectCategory,
  onCloseMobile,
}: CategoryLinkProps) {
  const Icon = getCategoryIcon(category.slug);
  const calcs = getCalculatorsForCategory(category.slug);
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onSelectCategory?.(category.slug);
    onCloseMobile?.();
    if (onSelectCategory && window.location.pathname === "/") {
      event.preventDefault();
      window.history.replaceState(null, "", `/#${category.slug}`);
    }
  };

  return (
    <div className="rail-tree__node" data-category-node={category.slug}>
      <Link
        href={`/#${category.slug}`}
        className="rail-tree__row"
        aria-current={isCurrent ? "page" : undefined}
        title={isCollapsed ? category.title : undefined}
        onClick={handleClick}
      >
        <span className="rail-tree__icon" aria-hidden>
          <Icon size={16} />
        </span>
        <span className="rail-tree__title">{category.title}</span>
        <span className="rail-tree__count">{calcs.length}</span>
      </Link>
    </div>
  );
}
