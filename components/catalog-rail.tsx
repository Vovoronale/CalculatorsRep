"use client";

import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, User, X } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";

import { SearchInput } from "@/components/search-input";
import { getCategoryIcon } from "@/lib/icons";
import {
  calculatorCategories,
  getChildCategories,
  getCalculatorsForCategory,
  getCategoryTrail,
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
  const [expandedCategories, setExpandedCategories] = useState<CategorySlug[]>(
    () => getOpenCategorySlugs(currentCategory),
  );

  useEffect(() => {
    const openSlugs = getOpenCategorySlugs(currentCategory);
    setExpandedCategories(openSlugs);
  }, [currentCategory]);

  const toggleExpandedCategory = (slug: CategorySlug) => {
    setExpandedCategories((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug],
    );
  };

  return (
    <aside
      className="catalog-rail"
      aria-label="Каталог калькуляторів"
      data-mobile-open={isMobileOpen ? "true" : "false"}
    >
      <div className="catalog-rail__brand-block">
        <Link href="/" className="catalog-rail__brand">
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
          {calculatorCategories
            .filter((category) => !category.parentSlug)
            .map((category) => (
            <CategoryLink
              key={category.slug}
              category={category}
              isCurrent={currentCategory === category.slug}
              currentCategory={currentCategory}
              isExpanded={expandedCategories.includes(category.slug)}
              onToggleExpanded={toggleExpandedCategory}
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

function getOpenCategorySlugs(categorySlug?: CategorySlug): CategorySlug[] {
  if (!categorySlug) return [];
  const [topLevelCategory] = getCategoryTrail(categorySlug);
  return topLevelCategory ? [topLevelCategory.slug] : [];
}

type CategoryLinkProps = {
  category: CalculatorCategory;
  isCurrent: boolean;
  currentCategory?: CategorySlug;
  isExpanded: boolean;
  onToggleExpanded: (slug: CategorySlug) => void;
  isCollapsed: boolean;
  onSelectCategory?: (slug: CategorySlug) => void;
  onCloseMobile?: () => void;
};

function CategoryLink({
  category,
  isCurrent,
  currentCategory,
  isExpanded,
  onToggleExpanded,
  isCollapsed,
  onSelectCategory,
  onCloseMobile,
}: CategoryLinkProps) {
  const Icon = getCategoryIcon(category.slug);
  const calcs = getCalculatorsForCategory(category.slug);
  const childCategories = getChildCategories(category.slug);
  const countState = calcs.length > 0 ? "filled" : "empty";
  const hasChildren = childCategories.length > 0;
  const childrenId = `rail-children-${category.slug}`;
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onSelectCategory?.(category.slug);
    onCloseMobile?.();
    if (hasChildren && !isExpanded) onToggleExpanded(category.slug);
    if (onSelectCategory && window.location.pathname === "/") {
      event.preventDefault();
      window.history.replaceState(null, "", `/#${category.slug}`);
    }
  };

  return (
    <div
      className="rail-tree__node"
      data-category-node={category.slug}
      data-expanded={isExpanded ? "true" : "false"}
    >
      <div className="rail-tree__branch">
        <Link
          href={`/#${category.slug}`}
          className="rail-tree__row"
          aria-current={isCurrent ? "page" : undefined}
          data-count-state={countState}
          title={isCollapsed ? category.title : undefined}
          onClick={handleClick}
        >
          <span className="rail-tree__icon" aria-hidden>
            <Icon size={16} />
          </span>
          <span className="rail-tree__title">{category.title}</span>
          <span className="rail-tree__count">{calcs.length}</span>
        </Link>
        {hasChildren ? (
          <button
            type="button"
            className="rail-tree__toggle"
            aria-expanded={isExpanded}
            aria-controls={childrenId}
            aria-label={`${isExpanded ? "Згорнути" : "Розгорнути"} ${category.title}`}
            title={isExpanded ? "Згорнути" : "Розгорнути"}
            onClick={() => onToggleExpanded(category.slug)}
          >
            {isExpanded ? (
              <ChevronDown size={14} aria-hidden />
            ) : (
              <ChevronRight size={14} aria-hidden />
            )}
          </button>
        ) : null}
      </div>
      {hasChildren && isExpanded ? (
        <ul className="rail-tree__children" id={childrenId}>
          {childCategories.map((child) => {
            const childCalcs = getCalculatorsForCategory(child.slug);
            const childCountState = childCalcs.length > 0 ? "filled" : "empty";
            const handleChildClick = (event: MouseEvent<HTMLAnchorElement>) => {
              onSelectCategory?.(child.slug);
              onCloseMobile?.();
              if (onSelectCategory && window.location.pathname === "/") {
                event.preventDefault();
                window.history.replaceState(null, "", `/#${child.slug}`);
              }
            };

            return (
              <li key={child.slug}>
                <Link
                  href={`/#${child.slug}`}
                  className={`rail-tree__leaf${
                    currentCategory === child.slug ? " is-current" : ""
                  }`}
                  aria-current={currentCategory === child.slug ? "page" : undefined}
                  data-count-state={childCountState}
                  onClick={handleChildClick}
                >
                  <span>{child.title}</span>
                  <span className="rail-tree__leaf-badge">{childCalcs.length}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
