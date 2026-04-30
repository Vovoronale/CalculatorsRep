"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, User, X } from "lucide-react";
import { useEffect, useState } from "react";

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
  syncWithHash?: boolean;
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
  selectedCalculator,
  syncWithHash = false,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}: CatalogRailProps) {
  const [expanded, setExpanded] = useState<Set<CategorySlug>>(() => {
    const initial = new Set<CategorySlug>();
    if (selectedCalculator) initial.add(selectedCalculator.mainCategory);
    if (typeof window !== "undefined") {
      const hashCat = resolveHashCategory();
      if (hashCat) initial.add(hashCat);
    }
    return initial;
  });

  useEffect(() => {
    const expand = (slug: CategorySlug | null) => {
      if (!slug) return;
      setExpanded((prev) => {
        if (prev.has(slug)) return prev;
        const next = new Set(prev);
        next.add(slug);
        return next;
      });
      requestAnimationFrame(() => {
        document
          .querySelector<HTMLElement>(`[data-category-node="${slug}"]`)
          ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
    };

    const onHash = () => expand(resolveHashCategory());
    const onRailEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ slug?: string }>).detail;
      const slug = detail?.slug;
      if (!slug) return;
      if (calculatorCategories.some((c) => c.slug === slug)) {
        expand(slug as CategorySlug);
      }
    };

    window.addEventListener("hashchange", onHash);
    window.addEventListener("rail:expand", onRailEvent);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("rail:expand", onRailEvent);
    };
  }, []);

  useEffect(() => {
    if (!selectedCalculator) return;
    setExpanded((prev) => {
      if (prev.has(selectedCalculator.mainCategory)) return prev;
      const next = new Set(prev);
      next.add(selectedCalculator.mainCategory);
      return next;
    });
  }, [selectedCalculator]);

  const toggle = (slug: CategorySlug) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
    if (syncWithHash && typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
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
        <div className="rail-tree">
          {calculatorCategories.map((category) => (
            <CategoryNode
              key={category.slug}
              category={category}
              isOpen={expanded.has(category.slug)}
              isCollapsed={isCollapsed}
              currentCalcSlug={selectedCalculator?.slug}
              onToggle={toggle}
              onLeafClick={onCloseMobile}
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

type CategoryNodeProps = {
  category: CalculatorCategory;
  isOpen: boolean;
  isCollapsed: boolean;
  currentCalcSlug?: string;
  onToggle: (slug: CategorySlug) => void;
  onLeafClick?: () => void;
};

function CategoryNode({
  category,
  isOpen,
  isCollapsed,
  currentCalcSlug,
  onToggle,
  onLeafClick,
}: CategoryNodeProps) {
  const Icon = getCategoryIcon(category.slug);
  const calcs = getCalculatorsForCategory(category.slug);
  const showChildren = isOpen && !isCollapsed;

  return (
    <div
      className="rail-tree__node"
      data-category-node={category.slug}
      data-open={isOpen ? "true" : "false"}
    >
      <button
        type="button"
        className="rail-tree__row"
        aria-expanded={isOpen}
        aria-controls={`rail-tree-children-${category.slug}`}
        aria-label={category.title}
        title={isCollapsed ? category.title : undefined}
        onClick={() => onToggle(category.slug)}
      >
        <ChevronRight
          size={14}
          className="rail-tree__chevron"
          data-open={isOpen ? "true" : "false"}
          aria-hidden
        />
        <span className="rail-tree__icon" aria-hidden>
          <Icon size={16} />
        </span>
        <span className="rail-tree__title">{category.title}</span>
        <span className="rail-tree__count" aria-hidden>{calcs.length}</span>
      </button>
      {showChildren ? (
        <ul
          className="rail-tree__children"
          id={`rail-tree-children-${category.slug}`}
        >
          {calcs.map((calc) => {
            const isCurrent = currentCalcSlug === calc.slug;
            return (
              <li key={calc.slug}>
                <Link
                  href={`/calculator/${calc.slug}`}
                  className={`rail-tree__leaf${isCurrent ? " is-current" : ""}`}
                  aria-label={calc.title}
                  aria-current={isCurrent ? "page" : undefined}
                  onClick={onLeafClick}
                >
                  <span>{calc.title}</span>
                  {calc.editorialLabel ? (
                    <span
                      className="rail-tree__leaf-badge"
                      aria-hidden
                    >
                      {calc.editorialLabel}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
