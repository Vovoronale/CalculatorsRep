"use client";

import type { ReactNode } from "react";

export type NativeCalculatorNavLink = {
  href: string;
  label: string;
};

type NativeCalculatorLayoutProps = {
  ariaLabel: string;
  navLinks: NativeCalculatorNavLink[];
  summary?: ReactNode;
  controls: ReactNode;
  diagramTitle?: string;
  diagrams?: ReactNode;
  errors?: string[];
  warnings?: string[];
  children?: ReactNode;
};

function StatusBlock({
  kind,
  messages,
}: {
  kind: "warning" | "error";
  messages?: string[];
}) {
  if (!messages?.length) return null;

  return (
    <div
      className={`native-calculator__status native-calculator__status--${kind}`}
      role={kind === "error" ? "alert" : "status"}
    >
      {kind === "error" ? (
        <ul>
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : (
        messages.map((message) => <p key={message}>{message}</p>)
      )}
    </div>
  );
}

export function NativeCalculatorLayout({
  ariaLabel,
  navLinks,
  summary,
  controls,
  diagramTitle = "Позначення величин",
  diagrams,
  errors,
  warnings,
  children,
}: NativeCalculatorLayoutProps) {
  const diagramTitleId = "native-calculator-diagrams-title";

  return (
    <div className="native-calculator" aria-label={ariaLabel}>
      <div className="native-calculator__input-shell">
        <aside className="native-calculator__menu" aria-label="Меню вводу">
          <p className="native-calculator__menu-label">Ввід</p>
          <nav className="native-calculator__menu-links" aria-label="Розділи вводу">
            {navLinks.map((link) => (
              <a href={link.href} key={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          {summary ? <div className="native-calculator__summary">{summary}</div> : null}
        </aside>

        <div className="native-calculator__controls">{controls}</div>

        {diagrams ? (
          <section className="native-calculator__diagrams" aria-labelledby={diagramTitleId}>
            <div className="native-report__head">
              <h3 id={diagramTitleId}>{diagramTitle}</h3>
            </div>
            {diagrams}
          </section>
        ) : null}
      </div>

      <StatusBlock kind="error" messages={errors} />
      <StatusBlock kind="warning" messages={warnings} />
      {children}
    </div>
  );
}
