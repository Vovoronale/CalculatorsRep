import React from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { CatalogRail } from "@/components/catalog-rail";
import { aiAssistants, projectCategories } from "@/lib/projects";
import { siteContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: `Про автора | ${siteContent.brand.authorName}`,
  description: siteContent.authorPage.title,
};

export default function AuthorPage() {
  return (
    <div className="site-shell">
      <CatalogRail initialCategory="beton" />

      <main className="site-workspace">
        <section className="author-hero">
          <p className="workspace-hero__eyebrow">{siteContent.authorPage.eyebrow}</p>
          <h1>{siteContent.brand.authorName}</h1>
          <p className="author-hero__lead">{siteContent.authorPage.title}</p>
          <div className="author-hero__copy">
            {siteContent.authorPage.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="author-section" aria-labelledby="directions-heading">
          <p className="workspace-panel__label">{siteContent.authorPage.directionsLabel}</p>
          <h2 id="directions-heading">Сфери, у яких поєдную інженерію, продукти і AI.</h2>
          <ul className="author-directions">
            {siteContent.authorPage.directions.map((direction) => (
              <li key={direction}>{direction}</li>
            ))}
          </ul>
        </section>

        <section className="author-section" aria-labelledby="author-projects-heading">
          <p className="workspace-panel__label">{siteContent.authorPage.projectsLabel}</p>
          <h2 id="author-projects-heading">{siteContent.authorPage.projectsTitle}</h2>
          <div className="author-project-groups">
            {projectCategories.map((category) => (
              <section
                key={category.slug}
                className="author-project-group"
                aria-labelledby={`author-project-category-${category.slug}`}
              >
                <div className="author-project-group__header">
                  <h3 id={`author-project-category-${category.slug}`}>{category.title}</h3>
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
                      <div>
                        <h4>{project.title}</h4>
                        <p>{project.description}</p>
                      </div>
                      <span>Відкрити</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="author-section" aria-labelledby="assistants-heading">
          <p className="workspace-panel__label">{siteContent.authorPage.assistantsLabel}</p>
          <h2 id="assistants-heading">{siteContent.authorPage.assistantsTitle}</h2>
          <p className="workspace-panel__description">{siteContent.authorPage.assistantsDescription}</p>
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
                <span>Відкрити асистента</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="author-section author-section--closing" aria-labelledby="closing-heading">
          <p className="workspace-panel__label">{siteContent.authorPage.closingLabel}</p>
          <h2 id="closing-heading">{siteContent.authorPage.closingTitle}</h2>
          <p className="workspace-panel__description">{siteContent.authorPage.closingDescription}</p>
        </section>
      </main>
    </div>
  );
}
