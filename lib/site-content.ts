import contentData from "@/data/content.json";

type UtilityLink = {
  label: string;
  href: string;
  external: boolean;
};

type Brand = {
  productName: string;
  subBrandName: string;
  umbrella: string;
  umbrellaMonogram: string;
  umbrellaWordmark: string;
  authorName: string;
  role: string;
};

export type TopbarProduct = {
  label: string;
  href: string;
  external: boolean;
  active?: boolean;
  tagline?: string;
};

export type TopbarLanguage = {
  code: string;
  label: string;
  available: boolean;
};

export type TopbarCta = {
  label: string;
  href: string;
};

type Topbar = {
  productsLabel: string;
  products: TopbarProduct[];
  allProductsLabel: string;
  allProductsHref: string;
  languages: TopbarLanguage[];
  cta: TopbarCta;
};

type Workspace = {
  eyebrow: string;
  title: string;
  description: string;
  railLabel: string;
  railDescription: string;
  categoryLabel: string;
  categoryHint: string;
  detailLabel: string;
  embeddedDetailNote: string;
  externalAccessNote: string;
  externalDetailNote: string;
  modalDetailNote: string;
  openEmbedded: string;
  openExternal: string;
  openModal: string;
  backToCatalog: string;
  openCatalogItem: string;
  authorCtaLabel: string;
  authorCtaTitle: string;
  authorCtaDescription: string;
};

type Footer = {
  note: string;
  authorCta: string;
};

type AuthorSocialLink = {
  label: string;
  href: string;
};

type AuthorPage = {
  eyebrow: string;
  title: string;
  intro: string[];
  socialLinksLabel: string;
  socialLinksTitle: string;
  socialLinks: AuthorSocialLink[];
};

export type LegalPageSection = {
  title: string;
  body: string[];
};

export type LegalPage = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  lead: string;
  updatedAt: string;
  sections: LegalPageSection[];
};

export type SiteContent = {
  brand: Brand;
  navigation: { utilityLinks: UtilityLink[] };
  topbar: Topbar;
  workspace: Workspace;
  footer: Footer;
  authorPage: AuthorPage;
  legalPages: LegalPage[];
};

export const siteContent: SiteContent = contentData.site as SiteContent;
