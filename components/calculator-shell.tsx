"use client";

import Link from "next/link";
import { ChevronDown, ExternalLink, MessageSquareWarning } from "lucide-react";
import { useEffect, useState } from "react";

import { CassoonLoadDistributionCalculator } from "@/components/calculators/cassoon-load-distribution-calculator";
import { ConcreteCoverDurabilityCalculator } from "@/components/calculators/concrete-cover-durability-calculator";
import { ConcreteExposureClassCalculator } from "@/components/calculators/concrete-exposure-class-calculator";
import { ConcreteCharacteristicsCalculator } from "@/components/calculators/concrete-characteristics-calculator";
import { FoundationBasePressureCalculator } from "@/components/calculators/foundation-base-pressure-calculator";
import { FoundationBarAnchorageCalculator } from "@/components/calculators/foundation-bar-anchorage-calculator";
import { MinimumReinforcementCalculator } from "@/components/calculators/minimum-reinforcement-calculator";
import { RebarAreaBarsCalculator } from "@/components/calculators/rebar-area-bars-calculator";
import { RebarCharacteristicsCalculator } from "@/components/calculators/rebar-characteristics-calculator";
import { ResidentialYardAreasCalculator } from "@/components/calculators/residential-yard-areas-calculator";
import { SoilDesignResistanceCalculator } from "@/components/calculators/soil-design-resistance-calculator";
import { SteelStructureCategoryGroupCalculator } from "@/components/calculators/steel-structure-category-group-calculator";
import { CalculatorCard } from "@/components/calculator-card";
import { CalculatorModal } from "@/components/calculator-modal";
import { CatalogRail } from "@/components/catalog-rail";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { FeedbackDialog } from "@/components/feedback-dialog";
import { MobileTopBar } from "@/components/mobile-top-bar";
import { SiteFooter } from "@/components/site-footer";
import { SupportStrip } from "@/components/support-strip";
import { WorkspaceTopBar, type Breadcrumb } from "@/components/workspace-top-bar";
import {
  calculators,
  calculatorCategories,
  getCalculatorCatalogHref,
  getCalculatorsForCategory,
  getCategoryTrail,
  getCalculatorSeoSections,
  type Calculator,
  type CalculatorSeoSection,
  type CategorySlug,
} from "@/lib/calculators";
import { getCalculatorArtworkPath } from "@/lib/calculator-artwork";
import { siteContent } from "@/lib/site-content";

type CalculatorShellProps = {
  selectedCategory?: CategorySlug;
  selectedCalculator?: Calculator;
};

export function CalculatorShell({
  selectedCategory,
  selectedCalculator,
}: CalculatorShellProps) {
  const detailCategoryTrail = selectedCalculator
    ? getCategoryTrail(selectedCalculator.mainCategory)
    : [];

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [modalCalculator, setModalCalculator] = useState<Calculator | null>(null);
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [bugReportPageUrl, setBugReportPageUrl] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategorySlug>(
    selectedCategory ?? selectedCalculator?.mainCategory ?? calculatorCategories[0].slug,
  );

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
    if (selectedCategory || selectedCalculator) return undefined;

    const resolveHashCategory = (): CategorySlug | null => {
      if (typeof window === "undefined") return null;
      const raw = window.location.hash.replace("#", "") as CategorySlug;
      return calculatorCategories.some((c) => c.slug === raw) ? raw : null;
    };

    const syncCategoryFromHash = () => {
      const hashCategory = resolveHashCategory();
      if (hashCategory) setActiveCategory(hashCategory);
    };

    syncCategoryFromHash();
    window.addEventListener("hashchange", syncCategoryFromHash);
    return () => {
      window.removeEventListener("hashchange", syncCategoryFromHash);
    };
  }, [selectedCalculator, selectedCategory]);

  useEffect(() => {
    if (selectedCalculator) setActiveCategory(selectedCalculator.mainCategory);
  }, [selectedCalculator]);

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

  const openBugReport = () => {
    setBugReportPageUrl(window.location.href);
    setBugReportOpen(true);
  };

  const detailBreadcrumbs: Breadcrumb[] | null =
    selectedCalculator && detailCategoryTrail.length > 0
      ? [
          { label: "Каталог", href: "/" },
          ...detailCategoryTrail.map((category) => ({
            label: category.title,
            href: `/#${category.slug}`,
          })),
          { label: selectedCalculator.title },
        ]
      : null;

  return (
    <div className="site-shell" data-collapsed={isCollapsed ? "true" : "false"}>
      <MobileTopBar onOpenDrawer={() => setIsMobileOpen(true)} />
      <DrawerBackdrop open={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

      <CatalogRail
        selectedCalculator={selectedCalculator}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
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
                <>
                  {selectedCalculator.displayMode === "embed" ? (
                    <Link
                      className="workspace-top-bar__action"
                      href={selectedCalculator.openUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink size={14} aria-hidden />
                      {siteContent.workspace.openEmbedded}
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    className="workspace-top-bar__action"
                    onClick={openBugReport}
                  >
                    <MessageSquareWarning size={14} aria-hidden />
                    Повідомити про помилку
                  </button>
                </>
              }
            />
            <div
              className={[
                "workspace-content",
                selectedCalculator.displayMode === "embed" && selectedCalculator.embedUrl
                  ? "workspace-content--embed"
                  : "workspace-content--reading",
                selectedCalculator.displayMode === "native"
                  ? "workspace-content--native"
                  : null,
              ]
                .filter(Boolean)
                .join(" ")}
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
              <HomeView
                activeCategory={activeCategory}
                onOpenModal={setModalCalculator}
              />
            </div>
          </>
        )}

        <SiteFooter />
      </main>

      <CalculatorModal
        calculator={modalCalculator}
        onClose={() => setModalCalculator(null)}
      />
      <FeedbackDialog
        open={bugReportOpen}
        mode="bug-report"
        onClose={() => setBugReportOpen(false)}
        calculatorContext={
          selectedCalculator
            ? {
                calculatorName: selectedCalculator.title,
                pageUrl: bugReportPageUrl,
              }
            : undefined
        }
      />
    </div>
  );
}

type HomeViewProps = {
  activeCategory: CategorySlug;
  onOpenModal: (calculator: Calculator) => void;
};

function HomeView({ activeCategory, onOpenModal }: HomeViewProps) {
  const category =
    calculatorCategories.find((item) => item.slug === activeCategory) ??
    calculatorCategories[0];
  const categoryCalculators = getCalculatorsForCategory(category.slug);

  return (
    <>
      <section className="workspace-section" aria-labelledby="home-calculators-title">
        <div className="workspace-section__head">
          <h2 className="workspace-section__title" id="home-calculators-title">
            {category.title}
          </h2>
          <p className="workspace-section__note">
            {category.note}
          </p>
        </div>
        <CalculatorCategoryTable
          categoryTitle={category.title}
          calculators={categoryCalculators}
          onOpenModal={onOpenModal}
        />
      </section>

      <section
        className="workspace-section workspace-section--author-cta"
        aria-labelledby="home-author-title"
      >
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

type CalculatorCategoryTableProps = {
  categoryTitle: string;
  calculators: Calculator[];
  onOpenModal: (calculator: Calculator) => void;
};

function CalculatorStandard({ standard }: { standard: string }) {
  const [primaryStandard, ...secondaryStandards] = standard
    .split(" / ")
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <span className="calculator-table__standards">
      <span className="calculator-table__standard-primary">
        {primaryStandard}
      </span>
      {secondaryStandards.length > 0 ? (
        <span className="calculator-table__standard-secondary-list">
          {secondaryStandards.map((item) => (
            <span className="calculator-table__standard-secondary" key={item}>
              {item}
            </span>
          ))}
        </span>
      ) : null}
    </span>
  );
}

function CalculatorCategoryTable({
  categoryTitle,
  calculators,
  onOpenModal,
}: CalculatorCategoryTableProps) {
  const [expandedDetails, setExpandedDetails] = useState<string[]>([]);

  const toggleDetails = (slug: string) => {
    setExpandedDetails((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug],
    );
  };

  return (
    <div className="calculator-table-wrap">
      <table
        className="calculator-table"
        aria-label={`Розрахунки категорії ${categoryTitle}`}
      >
        <thead>
          <tr>
            <th className="calculator-table__number-heading" scope="col">№</th>
            <th className="calculator-table__image-heading" scope="col" />
            <th scope="col">Розрахунок</th>
            <th scope="col">Норматив</th>
          </tr>
        </thead>
        <tbody>
          {calculators.map((calculator, index) => {
            const detailsId = `calculator-details-${calculator.slug}`;
            const isExpanded = expandedDetails.includes(calculator.slug);
            const rowNumber = String(index + 1).padStart(2, "0");

            return (
              <tr key={calculator.slug}>
                <td className="calculator-table__number-cell">
                  <span className="calculator-table__number">{rowNumber}</span>
                </td>
                <td className="calculator-table__image-cell">
                  <span className="calculator-table__artwork">
                    <img
                      className="calculator-table__image"
                      src={getCalculatorArtworkPath(calculator.slug)}
                      alt={`Іконка: ${calculator.title}`}
                      width="44"
                      height="44"
                      loading="lazy"
                    />
                    {calculator.displayMode === "embed" ||
                    calculator.displayMode === "external" ? (
                      <span
                        className={`calculator-table__access-marker calculator-table__access-marker--${calculator.displayMode}`}
                        aria-hidden
                      >
                        <ExternalLink size={10} />
                      </span>
                    ) : null}
                  </span>
                </td>
                <th scope="row">
                  <div className="calculator-table__title-row">
                    <span className="calculator-table__title-main">
                      {calculator.displayMode === "modal" ? (
                        <button
                          type="button"
                          className="calculator-table__link"
                          onClick={() => onOpenModal(calculator)}
                        >
                          {calculator.title}
                        </button>
                      ) : (
                        <Link
                          href={getCalculatorCatalogHref(calculator)}
                          className="calculator-table__link"
                        >
                          {calculator.title}
                        </Link>
                      )}
                      {calculator.editorialLabel ? (
                        <span className="calculator-table__badge">
                          {calculator.editorialLabel}
                        </span>
                      ) : null}
                    </span>
                    <button
                      type="button"
                      className="calculator-table__details-toggle"
                      aria-expanded={isExpanded}
                      aria-controls={detailsId}
                      aria-label={`${isExpanded ? "Згорнути" : "Показати"} деталі: ${calculator.title}`}
                      onClick={() => toggleDetails(calculator.slug)}
                    >
                      Деталі
                      <ChevronDown size={14} aria-hidden />
                    </button>
                  </div>
                  {isExpanded ? (
                    <p className="calculator-table__details" id={detailsId}>
                      {calculator.shortDescription}
                    </p>
                  ) : null}
                </th>
                <td>
                  <CalculatorStandard standard={calculator.standard} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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
  const directRelated = calculators
    .filter(
      (c) =>
        c.slug !== calculator.slug &&
        (c.mainCategory === calculator.mainCategory ||
          c.extraCategories.includes(calculator.mainCategory)),
    );
  const relatedCategoryTrail = getCategoryTrail(calculator.mainCategory);
  const parentCategory = relatedCategoryTrail.at(-2);
  const parentRelated = parentCategory
    ? getCalculatorsForCategory(parentCategory.slug).filter(
        (c) => c.slug !== calculator.slug,
      )
    : [];
  const related = (directRelated.length > 0 ? directRelated : parentRelated).slice(
    0,
    3,
  );

  if (showsIframe && calculator.embedUrl) {
    return (
      <IframeCalculatorDetail
        calculator={calculator}
        embedUrl={calculator.embedUrl}
        related={related}
        onOpenModal={onOpenModal}
      />
    );
  }

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
        <h1 id="detail-title" className="detail-header__title">
          {calculator.title}
        </h1>
        <p className="detail-header__desc">{calculator.shortDescription}</p>
        {!showsIframe && calculator.description ? (
          <p className="detail-header__long">{calculator.description}</p>
        ) : null}
      </header>

      {showsNative ? (
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

      <SupportStrip />

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

      {calculator.tags && calculator.tags.length > 0 ? (
        <ul className="detail-tags" aria-label={`Теги: ${calculator.title}`}>
          {calculator.tags.map((tag) => (
            <li key={tag}>#{tag}</li>
          ))}
        </ul>
      ) : null}

      <CalculatorSeoSections sections={getCalculatorSeoSections(calculator)} />

      {related.length > 0 ? (
        <section
          className="workspace-section workspace-section--related"
          aria-labelledby="detail-related-title"
        >
          <div className="workspace-section__head">
            <h2 className="workspace-section__title" id="detail-related-title">
              Схожі калькулятори
            </h2>
          </div>
          <div className="calc-grid calc-grid--compact">
            {related.map((calc) => (
              <CalculatorCard
                key={calc.slug}
                calculator={calc}
                className="calc-card--compact"
                onOpenModal={onOpenModal}
              />
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}

type IframeCalculatorDetailProps = {
  calculator: Calculator;
  embedUrl: string;
  related: Calculator[];
  onOpenModal: (calculator: Calculator) => void;
};

function IframeCalculatorDetail({
  calculator,
  embedUrl,
  related,
  onOpenModal,
}: IframeCalculatorDetailProps) {
  return (
    <section className="detail-section detail-section--embed" aria-label={calculator.title}>
      <h1 className="visually-hidden">{calculator.title}</h1>
      <div className="detail-embed">
        <iframe
          src={embedUrl}
          title={calculator.title}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <SupportStrip />

      <details className="detail-about">
        <summary>Про калькулятор</summary>
        <div className="detail-about__body">
          <div className="detail-header__badges">
            <span className="detail-badge detail-badge--accent">
              {calculator.accessLabel}
            </span>
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

          <div className="detail-about__intro">
            <p className="detail-header__desc">{calculator.shortDescription}</p>
            {calculator.description ? (
              <p className="detail-header__long">{calculator.description}</p>
            ) : null}
          </div>

          <ul className="detail-use-cases" aria-label={`Сценарії: ${calculator.title}`}>
            {calculator.useCases.map((useCase) => (
              <li key={useCase}>{useCase}</li>
            ))}
          </ul>

          {calculator.tags && calculator.tags.length > 0 ? (
            <ul className="detail-tags" aria-label={`Теги: ${calculator.title}`}>
              {calculator.tags.map((tag) => (
                <li key={tag}>#{tag}</li>
              ))}
            </ul>
          ) : null}

          <CalculatorSeoSections sections={getCalculatorSeoSections(calculator)} />

          {related.length > 0 ? (
            <section
              className="workspace-section workspace-section--related"
              aria-labelledby="detail-related-title"
            >
              <div className="workspace-section__head">
                <h2 className="workspace-section__title" id="detail-related-title">
                  Схожі калькулятори
                </h2>
              </div>
              <div className="calc-grid calc-grid--compact">
                {related.map((calc) => (
                  <CalculatorCard
                    key={calc.slug}
                    calculator={calc}
                    className="calc-card--compact"
                    onOpenModal={onOpenModal}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </details>
    </section>
  );
}

function CalculatorSeoSections({ sections }: { sections: CalculatorSeoSection[] }) {
  return (
    <section
      className="detail-seo"
      aria-labelledby="detail-seo-title"
      role="region"
    >
      <div className="detail-seo__head">
        <h2 id="detail-seo-title" className="detail-seo__title">
          Методика та нормативний контекст
        </h2>
      </div>
      <div className="detail-seo__grid">
        {sections.map((section) => (
          <article className="detail-seo__block" key={section.title}>
            <h3 className="detail-seo__block-title">{section.title}</h3>
            {section.body ? (
              <p className="detail-seo__text">{section.body}</p>
            ) : null}
            {section.items && section.items.length > 0 ? (
              <ul className="detail-seo__list">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function NativeCalculator({ calculator }: { calculator: Calculator }) {
  switch (calculator.nativeCalculator) {
    case "rebar-area-bars":
      return <RebarAreaBarsCalculator />;
    case "rebar-characteristics":
      return <RebarCharacteristicsCalculator />;
    case "concrete-characteristics":
      return <ConcreteCharacteristicsCalculator />;
    case "minimum-reinforcement-area":
      return <MinimumReinforcementCalculator />;
    case "foundation-bar-anchorage":
      return <FoundationBarAnchorageCalculator />;
    case "cassoon-load-distribution":
      return <CassoonLoadDistributionCalculator />;
    case "concrete-exposure-class":
      return <ConcreteExposureClassCalculator />;
    case "concrete-cover-durability":
      return <ConcreteCoverDurabilityCalculator />;
    case "soil-design-resistance":
      return <SoilDesignResistanceCalculator />;
    case "foundation-base-pressure":
      return <FoundationBasePressureCalculator />;
    case "residential-yard-areas":
      return <ResidentialYardAreasCalculator />;
    case "steel-structure-category-group":
      return <SteelStructureCategoryGroupCalculator />;
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
