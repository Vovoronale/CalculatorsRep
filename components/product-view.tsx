"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Download } from "lucide-react";

import { CatalogRail } from "@/components/catalog-rail";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { MobileTopBar } from "@/components/mobile-top-bar";
import { SiteFooter } from "@/components/site-footer";
import { WorkspaceTopBar } from "@/components/workspace-top-bar";
import type { Product } from "@/lib/products";

type ProductViewProps = {
  product: Product;
};

export function ProductView({ product }: ProductViewProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("sidebar:collapsed") === "true") {
        setIsCollapsed(true);
      }
    } catch {
      // Local storage is optional for the layout preference.
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((previous) => {
      const next = !previous;
      try {
        localStorage.setItem("sidebar:collapsed", next ? "true" : "false");
      } catch {
        // Local storage is optional for the layout preference.
      }
      return next;
    });
  };

  return (
    <div className="site-shell" data-collapsed={isCollapsed ? "true" : "false"}>
      <MobileTopBar onOpenDrawer={() => setIsMobileOpen(true)} />
      <DrawerBackdrop open={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
      <CatalogRail
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <main className="site-workspace">
        <WorkspaceTopBar
          breadcrumbs={[
            { label: "Каталог", href: "/" },
            { label: "Продукти", href: "/author" },
            { label: product.title },
          ]}
        />

        <article className="workspace-content workspace-content--reading product-page">
          <header className="product-hero">
            <p className="product-hero__eyebrow">{product.typeLabel}</p>
            <h1>{product.title}</h1>
            <p className="product-hero__lead">{product.shortDescription}</p>
            <a className="product-primary-action" href="#downloads">
              <Download aria-hidden size={18} />
              {product.downloadCtaLabel}
            </a>
          </header>

          {product.factsHeading && product.facts?.length ? (
            <section className="product-section" aria-labelledby="product-facts-heading">
              <h2 id="product-facts-heading">{product.factsHeading}</h2>
              <dl className="product-facts">
                {product.facts.map((fact) => (
                  <div key={fact.label} className="product-fact">
                    <dt>{fact.label}</dt>
                    <dd>{fact.label === "Команда" ? <code>{fact.value}</code> : fact.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <section className="product-section" aria-labelledby="product-features-heading">
            <h2 id="product-features-heading">{product.featuresHeading}</h2>
            <ul className="product-feature-list">
              {product.features.map((feature) => (
                <li key={feature}>
                  <Check aria-hidden size={18} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="product-section" aria-labelledby="product-description-heading">
            <h2 id="product-description-heading">{product.descriptionHeading}</h2>
            <p>{product.description}</p>
          </section>

          {product.usageHeading && product.usageSteps?.length ? (
            <section className="product-section" aria-labelledby="product-usage-heading">
              <h2 id="product-usage-heading">{product.usageHeading}</h2>
              <ol className="product-installation-list">
                {product.usageSteps.map((step) => (
                  <li key={step.title}>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                    {step.code ? (
                      <div className="product-code-list">
                        {step.code.map((value) => (
                          <code key={value}>{value}</code>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {product.warningHeading && product.warningParagraphs?.length ? (
            <section
              className="product-section product-warning"
              aria-labelledby="product-warning-heading"
              role="note"
            >
              <h2 id="product-warning-heading">{product.warningHeading}</h2>
              {product.warningParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ) : null}

          {product.screenshotsHeading &&
          product.screenshotsIntro &&
          product.screenshots?.length ? (
            <section className="product-section" aria-labelledby="product-screenshots-heading">
              <div className="product-section__intro">
                <h2 id="product-screenshots-heading">{product.screenshotsHeading}</h2>
                <p>{product.screenshotsIntro}</p>
              </div>
              <div className="product-screenshot-grid">
                {product.screenshots.map((screenshot) => (
                  <figure key={screenshot.src} className="product-screenshot">
                    <Image
                      src={screenshot.src}
                      alt={screenshot.alt}
                      width={screenshot.width}
                      height={screenshot.height}
                      sizes="(max-width: 720px) 100vw, 460px"
                    />
                    <figcaption>{screenshot.caption}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          <section
            id="downloads"
            className="product-section product-downloads"
            aria-labelledby="product-downloads-heading"
          >
            <div className="product-section__intro">
              <h2 id="product-downloads-heading">{product.downloadsHeading}</h2>
              <p>{product.downloadsIntro}</p>
            </div>
            <div className="product-download-grid">
              {product.downloads.map((download) => (
                <a
                  key={download.href}
                  className="product-download-card"
                  href={download.href}
                  aria-label={download.ariaLabel}
                >
                  <span>{download.label}</span>
                  <strong>
                    <Download aria-hidden size={17} />
                    {download.ctaLabel}
                  </strong>
                </a>
              ))}
            </div>
          </section>

          <section className="product-section" aria-labelledby="product-installation-heading">
            <h2 id="product-installation-heading">{product.installationHeading}</h2>
            <ol className="product-installation-list">
              {product.installationSteps.map((step) => (
                <li key={step.title}>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  {step.code ? (
                    <div className="product-code-list">
                      {step.code.map((value) => (
                        <code key={value}>{value}</code>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>

          <section
            className="product-section product-license"
            aria-labelledby="product-license-heading"
          >
            <h2 id="product-license-heading">{product.licenseHeading}</h2>
            {product.licenseTerms.map((term) => (
              <p key={term}>{term}</p>
            ))}
          </section>
        </article>

        <SiteFooter />
      </main>
    </div>
  );
}
