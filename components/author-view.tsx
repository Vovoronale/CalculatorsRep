"use client";

import { useEffect, useState } from "react";

import { CatalogRail } from "@/components/catalog-rail";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { MobileTopBar } from "@/components/mobile-top-bar";
import { SiteFooter } from "@/components/site-footer";
import { WorkspaceTopBar } from "@/components/workspace-top-bar";
import { siteContent } from "@/lib/site-content";

function getInitials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AuthorView() {
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

  const initials = getInitials(siteContent.brand.authorName);

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
            { label: "Про автора" },
          ]}
        />

        <div className="workspace-content">
          <section className="author-hero" aria-labelledby="author-title">
            <div className="author-hero__top">
              <div className="author-avatar" aria-hidden>
                {initials}
              </div>
              <div className="author-hero__identity">
                <p className="author-hero__eyebrow">{siteContent.authorPage.eyebrow}</p>
                <h1 id="author-title">{siteContent.brand.authorName}</h1>
                <p className="author-hero__role">{siteContent.authorPage.title}</p>
              </div>
            </div>
            <div className="author-hero__copy">
              {siteContent.authorPage.intro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>

          <section className="author-section" aria-labelledby="author-socials-heading">
            <p className="author-section__label">
              {siteContent.authorPage.socialLinksLabel}
            </p>
            <h2 id="author-socials-heading">{siteContent.authorPage.socialLinksTitle}</h2>
            <div className="author-socials">
              {siteContent.authorPage.socialLinks.map((link) => (
                <a
                  key={link.href}
                  className="author-social-link"
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </section>
        </div>

        <SiteFooter />
      </main>
    </div>
  );
}
