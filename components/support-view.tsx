"use client";

import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

import { CatalogRail } from "@/components/catalog-rail";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { MobileTopBar } from "@/components/mobile-top-bar";
import { SiteFooter } from "@/components/site-footer";
import { WorkspaceTopBar } from "@/components/workspace-top-bar";
import { siteContent } from "@/lib/site-content";

export function SupportView() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("sidebar:collapsed") === "true") {
        setIsCollapsed(true);
      }
    } catch {
      // localStorage unavailable; ignore
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((previous) => {
      const next = !previous;
      try {
        localStorage.setItem("sidebar:collapsed", next ? "true" : "false");
      } catch {
        // localStorage unavailable; ignore
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
            { label: siteContent.support.eyebrow },
          ]}
        />

        <div className="workspace-content">
          <section className="support-page" aria-labelledby="support-page-title">
            <p className="support-page__eyebrow">{siteContent.support.eyebrow}</p>
            <h1 id="support-page-title">{siteContent.support.title}</h1>
            <div className="support-page__copy">
              {siteContent.support.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <a
              className="cta-button support-page__cta"
              href={siteContent.support.patreonHref}
              target="_blank"
              rel="noreferrer"
            >
              {siteContent.support.ctaLabel}
              <ExternalLink size={14} aria-hidden />
            </a>
          </section>
        </div>

        <SiteFooter />
      </main>
    </div>
  );
}
