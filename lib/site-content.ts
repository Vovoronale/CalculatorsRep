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

type AuthorPage = {
  eyebrow: string;
  title: string;
  intro: string[];
  directionsLabel: string;
  directionsTitle: string;
  directions: string[];
  projectsLabel: string;
  projectsTitle: string;
  assistantsLabel: string;
  assistantsTitle: string;
  assistantsDescription: string;
  closingLabel: string;
  closingTitle: string;
  closingDescription: string;
};

export type SiteContent = {
  brand: Brand;
  navigation: { utilityLinks: UtilityLink[] };
  topbar: Topbar;
  workspace: Workspace;
  footer: Footer;
  authorPage: AuthorPage;
};

export const siteContent: SiteContent = contentData.site as SiteContent;
