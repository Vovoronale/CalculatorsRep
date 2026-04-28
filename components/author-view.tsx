"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

import { CatalogRail } from "@/components/catalog-rail";
import { DrawerBackdrop } from "@/components/drawer-backdrop";
import { MobileTopBar } from "@/components/mobile-top-bar";
import { SiteFooter } from "@/components/site-footer";
import { WorkspaceTopBar } from "@/components/workspace-top-bar";
import { aiAssistants, projectCategories } from "@/lib/projects";
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
        initialCategory="beton"
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

          <section className="author-section" aria-labelledby="directions-heading">
            <p className="author-section__label">
              {siteContent.authorPage.directionsLabel}
            </p>
            <h2 id="directions-heading">{siteContent.authorPage.directionsTitle}</h2>
            <ul className="author-directions">
              {siteContent.authorPage.directions.map((direction) => (
                <li key={direction}>{direction}</li>
              ))}
            </ul>
          </section>

          <section className="author-section" aria-labelledby="author-projects-heading">
            <p className="author-section__label">{siteContent.authorPage.projectsLabel}</p>
            <h2 id="author-projects-heading">{siteContent.authorPage.projectsTitle}</h2>
            <div className="author-projects">
              {projectCategories.map((category) => (
                <section
                  key={category.slug}
                  className="author-project-group"
                  aria-labelledby={`author-project-category-${category.slug}`}
                >
                  <div className="author-project-group__head">
                    <h3 id={`author-project-category-${category.slug}`}>
                      {category.title}
                    </h3>
                    <p>{category.description}</p>
                  </div>
                  <div className="author-project-group__list">
                    {category.projects.map((project) => (
                      <Link
                        key={project.slug}
                        className="author-project-link"
                        href={project.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={project.title}
                      >
                        <div className="author-project-link__body">
                          <h4>{project.title}</h4>
                          <p>{project.description}</p>
                        </div>
                        <span className="author-project-link__cta">
                          <ExternalLink size={12} aria-hidden /> Відкрити
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>

          <section className="author-section" aria-labelledby="assistants-heading">
            <p className="author-section__label">
              {siteContent.authorPage.assistantsLabel}
            </p>
            <h2 id="assistants-heading">{siteContent.authorPage.assistantsTitle}</h2>
            <p className="author-section__lead">
              {siteContent.authorPage.assistantsDescription}
            </p>
            <div className="author-assistants">
              {aiAssistants.map((assistant) => (
                <Link
                  key={assistant.slug}
                  className="author-assistant-link"
                  href={assistant.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={assistant.title}
                >
                  <h3>{assistant.title}</h3>
                  <p>{assistant.description}</p>
                  <span className="author-assistant-link__cta">
                    <ExternalLink size={12} aria-hidden /> Відкрити асистента
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="author-section" aria-labelledby="closing-heading">
            <p className="author-section__label">
              {siteContent.authorPage.closingLabel}
            </p>
            <h2 id="closing-heading">{siteContent.authorPage.closingTitle}</h2>
            <p className="author-section__lead">
              {siteContent.authorPage.closingDescription}
            </p>
          </section>
        </div>

        <SiteFooter />
      </main>
    </div>
  );
}
