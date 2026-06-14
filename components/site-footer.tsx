import Link from "next/link";

import { siteContent } from "@/lib/site-content";

export function SiteFooter() {
  const utilityLinks = siteContent.navigation.utilityLinks;
  const ecosystemLinks = utilityLinks.filter((link) => link.external || link.href === "/author");
  const legalLinks = utilityLinks.filter((link) => !link.external && link.href !== "/author");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <section className="site-footer__brand" aria-label="Про платформу">
          <Link
            href="/"
            className="ivapps-logo site-footer__logo"
            aria-label={siteContent.brand.umbrella}
          >
            <span className="ivapps-logo__mark">{siteContent.brand.umbrellaMonogram}</span>
            <span className="ivapps-logo__wordmark">{siteContent.brand.umbrellaWordmark}</span>
          </Link>
          <p className="site-footer__eyebrow">{siteContent.brand.productName}</p>
          <p className="site-footer__description">{siteContent.brand.role}</p>
          <p className="site-footer__note">{siteContent.footer.note}</p>
        </section>

        <nav className="site-footer__nav" aria-label="Навігація футера">
          <section className="site-footer__group" aria-labelledby="footer-ecosystem">
            <h2 id="footer-ecosystem">Екосистема</h2>
            <div className="site-footer__links">
              {ecosystemLinks.map((link) => (
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
          </section>

          <section className="site-footer__group" aria-labelledby="footer-legal">
            <h2 id="footer-legal">Документи</h2>
            <div className="site-footer__links">
              {legalLinks.map((link) => (
                <Link key={link.label} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          <section
            className="site-footer__group site-footer__group--contact"
            aria-labelledby="footer-contact"
          >
            <h2 id="footer-contact">Контакт</h2>
            <a className="site-footer__contact" href={`mailto:${siteContent.footer.contactEmail}`}>
              {siteContent.footer.contactEmail}
            </a>
          </section>
        </nav>
      </div>

      <div className="site-footer__bottom">
        <span>© {currentYear} {siteContent.brand.umbrella}</span>
        <span>{siteContent.brand.authorName}</span>
      </div>
    </footer>
  );
}
