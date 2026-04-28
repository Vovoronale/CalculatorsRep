"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { siteContent } from "@/lib/site-content";

type MobileTopBarProps = {
  onOpenDrawer: () => void;
};

export function MobileTopBar({ onOpenDrawer }: MobileTopBarProps) {
  const { umbrella, umbrellaMonogram, umbrellaWordmark } = siteContent.brand;

  return (
    <div className="mobile-top-bar">
      <button
        type="button"
        className="mobile-top-bar__menu"
        onClick={onOpenDrawer}
        aria-label="Відкрити каталог"
      >
        <Menu size={20} aria-hidden />
      </button>
      <Link href="/" className="ivapps-logo mobile-top-bar__brand" aria-label={umbrella}>
        <span className="ivapps-logo__mark" aria-hidden>
          {umbrellaMonogram}
        </span>
        <span className="ivapps-logo__wordmark">{umbrellaWordmark}</span>
      </Link>
      <ThemeToggle variant="icon" className="mobile-top-bar__theme" />
    </div>
  );
}
