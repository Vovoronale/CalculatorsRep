"use client";

import { useEffect, useState } from "react";

import { CatalogRail } from "@/components/catalog-rail";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { MobileTopBar } from "@/components/mobile-top-bar";
import { SiteFooter } from "@/components/site-footer";
import { WorkspaceTopBar } from "@/components/workspace-top-bar";
import type { LegalPage } from "@/lib/site-content";

type LegalPageViewProps = {
  page: LegalPage;
};

export function LegalPageView({ page }: LegalPageViewProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("sidebar:collapsed") === "true") {
        setIsCollapsed(true);
      }
    } catch {
      // ignore
    }
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
            { label: page.title },
          ]}
        />

        <div className="workspace-content">
          <section className="legal-page" aria-labelledby="legal-page-title">
            <p className="legal-page__eyebrow">{page.eyebrow}</p>
            <h1 id="legal-page-title">{page.title}</h1>
            <p className="legal-page__lead">{page.lead}</p>
            <p className="legal-page__updated">Оновлено: {page.updatedAt}</p>
          </section>

          <div className="legal-page__sections">
            {page.sections.map((section) => (
              <section
                key={section.title}
                className="legal-section"
                aria-labelledby={`legal-section-${slugify(section.title)}`}
              >
                <h2 id={`legal-section-${slugify(section.title)}`}>
                  {section.title}
                </h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
          </div>
        </div>

        <SiteFooter />
      </main>
    </div>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-zа-яіїєґ0-9]+/gi, "-")
    .replace(/^-|-$/g, "");
}
