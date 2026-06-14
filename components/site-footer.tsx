import Link from "next/link";

import { siteContent } from "@/lib/site-content";

export function SiteFooter() {
  const utilityLinks = siteContent.navigation.utilityLinks;

  return (
    <footer className="site-footer">
      <p>{siteContent.footer.note}</p>
      <div className="site-footer__links">
        {utilityLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noreferrer" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </footer>
  );
}
