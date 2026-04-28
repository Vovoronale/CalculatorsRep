"use client";

import Link from "next/link";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ProductsDropdown } from "@/components/products-dropdown";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteContent } from "@/lib/site-content";

export function IVappsTopbar() {
  const { umbrella, umbrellaMonogram, umbrellaWordmark } = siteContent.brand;
  const { cta } = siteContent.topbar;

  return (
    <header className="ivapps-topbar" aria-label={umbrella}>
      <div className="ivapps-topbar__left">
        <Link href="/" className="ivapps-logo" aria-label={umbrella}>
          <span className="ivapps-logo__mark" aria-hidden>
            {umbrellaMonogram}
          </span>
          <span className="ivapps-logo__wordmark">{umbrellaWordmark}</span>
        </Link>
        <span className="ivapps-topbar__divider" aria-hidden />
        <ProductsDropdown />
      </div>

      <div className="ivapps-topbar__right">
        <LanguageSwitcher />
        <span className="ivapps-topbar__divider" aria-hidden />
        <ThemeToggle variant="icon" className="ivapps-topbar__theme" />
        <a className="topbar-cta" href={cta.href}>
          {cta.label}
        </a>
      </div>
    </header>
  );
}
