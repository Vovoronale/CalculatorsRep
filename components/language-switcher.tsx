"use client";

import { siteContent } from "@/lib/site-content";

const ACTIVE_LANG_CODE = "uk";

export function LanguageSwitcher() {
  const { languages } = siteContent.topbar;

  return (
    <div className="lang-switcher" role="group" aria-label="Мова інтерфейсу">
      {languages.map((language) => {
        const isActive = language.code === ACTIVE_LANG_CODE;
        const isAvailable = language.available;
        return (
          <button
            key={language.code}
            type="button"
            className={`lang-switcher__pill${isActive ? " is-active" : ""}`}
            aria-pressed={isActive}
            disabled={!isAvailable}
            title={isAvailable ? language.label : "Скоро / Coming soon"}
          >
            {language.label}
          </button>
        );
      })}
    </div>
  );
}
