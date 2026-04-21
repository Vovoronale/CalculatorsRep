import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

import { aiAssistants, projectCategories } from "@/lib/projects";
import { siteContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: `Про автора | ${siteContent.brand.authorName}`,
  description: siteContent.authorPage.title,
};

export default function AuthorPage() {
  return (
    <main className="author-page">
      <section className="author-hero">
        <p className="topbar__eyebrow">{siteContent.authorPage.eyebrow}</p>
        <h1>{siteContent.brand.authorName}</h1>
        <p className="author-hero__lead">{siteContent.authorPage.title}</p>
        <div className="author-hero__copy">
          {siteContent.authorPage.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="author-section" aria-labelledby="directions-heading">
        <p className="panel-label">{siteContent.authorPage.directionsLabel}</p>
        <h2 id="directions-heading">Сфери, у яких поєдную інженерію, продукти і AI.</h2>
        <ul className="author-directions">
          {siteContent.authorPage.directions.map((direction) => (
            <li key={direction}>{direction}</li>
          ))}
        </ul>
      </section>

      <section className="author-section" aria-labelledby="author-projects-heading">
        <p className="panel-label">{siteContent.authorPage.projectsLabel}</p>
        <h2 id="author-projects-heading">{siteContent.authorPage.projectsTitle}</h2>
        <div className="project-categories">
          {projectCategories.map((category) => (
            <section
              key={category.slug}
              className="project-category"
              aria-labelledby={`author-project-category-${category.slug}`}
            >
              <div className="project-category__header">
                <h3 id={`author-project-category-${category.slug}`}>{category.title}</h3>
                <p>{category.description}</p>
              </div>
              <div className="project-list">
                {category.projects.map((project) => (
                  <Link
                    key={project.slug}
                    className="project-row"
                    href={project.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={project.title}
                  >
                    <div className="project-row__copy">
                      <h4>{project.title}</h4>
                      <p>{project.description}</p>
                    </div>
                    <span className="project-row__cta">Відкрити</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="author-section" aria-labelledby="assistants-heading">
        <p className="panel-label">{siteContent.authorPage.assistantsLabel}</p>
        <h2 id="assistants-heading">{siteContent.authorPage.assistantsTitle}</h2>
        <p className="author-section__description">
          {siteContent.authorPage.assistantsDescription}
        </p>
        <div className="assistants-grid">
          {aiAssistants.map((assistant) => (
            <Link
              key={assistant.slug}
              className="assistant-card"
              href={assistant.href}
              target="_blank"
              rel="noreferrer"
              aria-label={assistant.title}
            >
              <h3>{assistant.title}</h3>
              <p>{assistant.description}</p>
              <span className="project-row__cta">Відкрити асистента</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="author-section author-section--closing" aria-labelledby="closing-heading">
        <p className="panel-label">{siteContent.authorPage.closingLabel}</p>
        <h2 id="closing-heading">{siteContent.authorPage.closingTitle}</h2>
        <p className="author-section__description">{siteContent.authorPage.closingDescription}</p>
      </section>
    </main>
  );
}
