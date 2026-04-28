import Link from "next/link";

import { siteContent } from "@/lib/site-content";

export function SiteFooter() {
  const externalLinks = siteContent.navigation.utilityLinks.filter(
    (link) => link.external,
  );

  return (
    <footer className="site-footer">
      <p>{siteContent.footer.note}</p>
      <div className="site-footer__links">
        {externalLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </footer>
  );
}
