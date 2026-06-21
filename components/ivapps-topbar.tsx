"use client";

import Link from "next/link";
import { useState } from "react";

import { FeedbackDialog } from "@/components/feedback-dialog";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteContent } from "@/lib/site-content";

export function IVappsTopbar() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { umbrella, umbrellaWordmark } = siteContent.brand;
  const { cta } = siteContent.topbar;

  return (
    <>
      <header className="ivapps-topbar" aria-label={umbrella}>
        <div className="ivapps-topbar__left">
          <Link href="/" className="ivapps-logo" aria-label={umbrella}>
            <img
              className="ivapps-logo__mark"
              src="/brand/ivapps-icon.png"
              alt=""
              aria-hidden="true"
            />
            <span className="ivapps-logo__wordmark">{umbrellaWordmark}</span>
          </Link>
        </div>

        <div className="ivapps-topbar__right">
          <LanguageSwitcher />
          <span className="ivapps-topbar__divider" aria-hidden />
          <ThemeToggle variant="icon" className="ivapps-topbar__theme" />
          <button
            type="button"
            className="topbar-cta"
            onClick={() => setFeedbackOpen(true)}
          >
            {cta.label}
          </button>
        </div>
      </header>
      <FeedbackDialog
        open={feedbackOpen}
        mode="suggestion"
        onClose={() => setFeedbackOpen(false)}
      />
    </>
  );
}
