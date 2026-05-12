"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

import { RebarAreaBarsCalculator } from "@/components/calculators/rebar-area-bars-calculator";
import { CalculatorCard } from "@/components/calculator-card";
import { CalculatorModal } from "@/components/calculator-modal";
import { CategoryCard } from "@/components/category-card";
import { CatalogRail } from "@/components/catalog-rail";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { MobileTopBar } from "@/components/mobile-top-bar";
import { SiteFooter } from "@/components/site-footer";
import { WorkspaceTopBar, type Breadcrumb } from "@/components/workspace-top-bar";
import {
  calculators,
  calculatorCategories,
  type Calculator,
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
  const detailCategory = selectedCalculator
    ? calculatorCategories.find(
        (c) => c.slug === selectedCalculator.mainCategory,
      ) ?? calculatorCategories[0]
    : null;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [modalCalculator, setModalCalculator] = useState<Calculator | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem("sidebar:collapsed") === "true") {
        setIsCollapsed(true);
      }
    } catch {
      // localStorage unavailable; ignore
    }
  }, []);

  useEffect(() => {
    const openIfMobile = () => {
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 767px)").matches
      ) {
        setIsMobileOpen(true);
      }
    };
    window.addEventListener("hashchange", openIfMobile);
    window.addEventListener("rail:expand", openIfMobile);
    return () => {
      window.removeEventListener("hashchange", openIfMobile);
      window.removeEventListener("rail:expand", openIfMobile);
    };
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar:collapsed", next ? "true" : "false");
      } catch {
        // ignore
      }
      return next;
    });
  };

  const detailBreadcrumbs: Breadcrumb[] | null =
    selectedCalculator && detailCategory
      ? [
          { label: "Каталог", href: "/" },
          {
            label: detailCategory.title,
            href: `/#${detailCategory.slug}`,
          },
          { label: selectedCalculator.title },
        ]
      : null;

  return (
    <div className="site-shell" data-collapsed={isCollapsed ? "true" : "false"}>
      <MobileTopBar onOpenDrawer={() => setIsMobileOpen(true)} />
      <DrawerBackdrop open={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

      <CatalogRail
        selectedCalculator={selectedCalculator}
        syncWithHash={!selectedCategory && !selectedCalculator}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <main className="site-workspace">
        {selectedCalculator && detailBreadcrumbs ? (
          <>
            <WorkspaceTopBar
              breadcrumbs={detailBreadcrumbs}
              actions={
                selectedCalculator.displayMode === "embed" ? (
                  <Link
                    className="workspace-top-bar__action"
                    href={selectedCalculator.openUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={14} aria-hidden />
                    {siteContent.workspace.openEmbedded}
                  </Link>
                ) : null
              }
            />
            <div
              className={
                selectedCalculator.displayMode === "embed" &&
                selectedCalculator.embedUrl
                  ? "workspace-content workspace-content--embed"
                  : "workspace-content workspace-content--reading"
              }
            >
              <CalculatorDetail
                calculator={selectedCalculator}
                onOpenModal={setModalCalculator}
              />
            </div>
          </>
        ) : (
          <>
            <WorkspaceTopBar breadcrumbs={[{ label: "Каталог" }]} />
            <div className="workspace-content">
              <HomeView onOpenModal={setModalCalculator} />
            </div>
          </>
        )}

        <SiteFooter />
      </main>

      <CalculatorModal
        calculator={modalCalculator}
        onClose={() => setModalCalculator(null)}
      />
    </div>
  );
}

type HomeViewProps = {
  onOpenModal: (calculator: Calculator) => void;
};

function HomeView({ onOpenModal }: HomeViewProps) {
  const popular = calculators.filter((c) => c.editorialLabel === "Популярний");

  return (
    <>
      <section className="workspace-hero" aria-labelledby="home-hero-title">
        <p className="workspace-hero__eyebrow">{siteContent.workspace.eyebrow}</p>
        <h1 id="home-hero-title">{siteContent.workspace.title}</h1>
        <p className="workspace-hero__stats">
          <strong>{calculators.length}</strong> калькуляторів ·{" "}
          <strong>{calculatorCategories.length}</strong> категорій · вбудовані, модальні та зовнішні інструменти
        </p>
        {popular.length > 0 ? (
          <div className="workspace-hero__chips">
            <p className="workspace-hero__chips-label">Популярне:</p>
            {popular.map((calc) =>
              calc.displayMode === "modal" ? (
                <button
                  key={calc.slug}
                  type="button"
                  className="workspace-hero__chip"
                  onClick={() => onOpenModal(calc)}
                >
                  {calc.title}
                </button>
              ) : (
                <Link
                  key={calc.slug}
                  href={`/calculator/${calc.slug}`}
                  className="workspace-hero__chip"
                >
                  {calc.title}
                </Link>
              ),
            )}
          </div>
        ) : null}
      </section>

      <section className="workspace-section" aria-labelledby="home-categories-title">
        <div className="workspace-section__head">
          <h2 className="workspace-section__title" id="home-categories-title">
            Усі категорії
          </h2>
          <p className="workspace-section__note">{siteContent.workspace.categoryHint}</p>
        </div>
        <div className="category-grid">
          {calculatorCategories.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>
      </section>

      <section className="workspace-section" aria-labelledby="home-calculators-title">
        <div className="workspace-section__head">
          <h2 className="workspace-section__title" id="home-calculators-title">
            Усі калькулятори
          </h2>
          <p className="workspace-section__note">
            <strong>{calculators.length}</strong> інструментів у{" "}
            <strong>{calculatorCategories.length}</strong> категоріях.
          </p>
        </div>
        <div className="calc-grid">
          {calculators.map((calculator) => (
            <CalculatorCard
              key={calculator.slug}
              calculator={calculator}
              showCategoryBadge
              onOpenModal={onOpenModal}
            />
          ))}
        </div>
      </section>

      <section className="workspace-section" aria-labelledby="home-author-title">
        <div className="workspace-section__head">
          <h2 className="workspace-section__title" id="home-author-title">
            {siteContent.workspace.authorCtaTitle}
          </h2>
        </div>
        <p className="workspace-section__note">
          {siteContent.workspace.authorCtaDescription}
        </p>
        <Link className="cta-button cta-button--ghost" href="/author">
          Про автора
        </Link>
      </section>
    </>
  );
}

type CalculatorDetailProps = {
  calculator: Calculator;
  onOpenModal: (calculator: Calculator) => void;
};

function CalculatorDetail({ calculator, onOpenModal }: CalculatorDetailProps) {
  const showsIframe =
    calculator.displayMode === "embed" && Boolean(calculator.embedUrl);
  const showsNative = calculator.displayMode === "native";
  const related = calculators
    .filter(
      (c) =>
        c.slug !== calculator.slug &&
        (c.mainCategory === calculator.mainCategory ||
          c.extraCategories.includes(calculator.mainCategory)),
    )
    .slice(0, 3);

  return (
    <section className="detail-section" aria-labelledby="detail-title">
      <header className="detail-header">
        <div className="detail-header__badges">
          <span className="detail-badge detail-badge--accent">{calculator.accessLabel}</span>
          {calculator.editorialLabel ? (
            <span className="detail-badge detail-badge--neutral">
              {calculator.editorialLabel}
            </span>
          ) : null}
          {calculator.tools?.map((tool) => (
            <span key={tool} className="detail-badge detail-badge--neutral">
              {tool}
            </span>
          ))}
        </div>
        <h2 id="detail-title" className="detail-header__title">
          {calculator.title}
        </h2>
        <p className="detail-header__desc">{calculator.shortDescription}</p>
        {!showsIframe && calculator.description ? (
          <p className="detail-header__long">{calculator.description}</p>
        ) : null}
      </header>

      {!showsIframe ? (
        <ul
          className="detail-use-cases"
          aria-label={`Сценарії: ${calculator.title}`}
        >
          {calculator.useCases.map((useCase) => (
            <li key={useCase}>{useCase}</li>
          ))}
        </ul>
      ) : null}

      {showsIframe && calculator.embedUrl ? (
        <div className="detail-embed">
          <iframe
            src={calculator.embedUrl}
            title={calculator.title}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : showsNative ? (
        <NativeCalculator calculator={calculator} />
      ) : calculator.displayMode === "modal" && calculator.embedUrl ? (
        <div className="detail-external">
          <h3 className="detail-external__title">{calculator.accessLabel}</h3>
          <p className="detail-external__desc">
            {siteContent.workspace.modalDetailNote}
          </p>
          <button
            type="button"
            className="cta-button"
            onClick={() => onOpenModal(calculator)}
          >
            {siteContent.workspace.openModal}
          </button>
        </div>
      ) : (
        <div className="detail-external">
          <h3 className="detail-external__title">{calculator.accessLabel}</h3>
          <p className="detail-external__desc">
            {siteContent.workspace.externalDetailNote}
          </p>
          <Link
            className="cta-button"
            href={calculator.openUrl}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={14} aria-hidden />
            {siteContent.workspace.openExternal}
          </Link>
        </div>
      )}

      {calculator.tags && calculator.tags.length > 0 ? (
        <ul className="detail-tags" aria-label={`Теги: ${calculator.title}`}>
          {calculator.tags.map((tag) => (
            <li key={tag}>#{tag}</li>
          ))}
        </ul>
      ) : null}

      {related.length > 0 ? (
        <section className="workspace-section" aria-labelledby="detail-related-title">
          <div className="workspace-section__head">
            <h2 className="workspace-section__title" id="detail-related-title">
              Схожі калькулятори
            </h2>
          </div>
          <div className="calc-grid">
            {related.map((calc) => (
              <CalculatorCard
                key={calc.slug}
                calculator={calc}
                onOpenModal={onOpenModal}
              />
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}

function NativeCalculator({ calculator }: { calculator: Calculator }) {
  switch (calculator.nativeCalculator) {
    case "rebar-area-bars":
      return <RebarAreaBarsCalculator />;
    default:
      return (
        <div className="detail-external">
          <h3 className="detail-external__title">{calculator.accessLabel}</h3>
          <p className="detail-external__desc">
            Локальний калькулятор для цього запису ще не налаштований.
          </p>
        </div>
      );
  }
}
