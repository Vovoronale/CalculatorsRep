import contentData from "@/data/content.json";

export type ProductScreenshot = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
};

export type ProductDownload = {
  label: string;
  ctaLabel: string;
  ariaLabel: string;
  href: string;
};

export type ProductFact = {
  label: string;
  value: string;
};

export type ProductInstallationStep = {
  title: string;
  description: string;
  code?: string[];
};

export type Product = {
  slug: string;
  typeLabel: string;
  title: string;
  shortDescription: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  downloadCtaLabel: string;
  factsHeading?: string;
  facts?: ProductFact[];
  featuresHeading: string;
  features: string[];
  descriptionHeading: string;
  usageHeading?: string;
  usageSteps?: ProductInstallationStep[];
  warningHeading?: string;
  warningParagraphs?: string[];
  screenshotsHeading?: string;
  screenshotsIntro?: string;
  screenshots?: ProductScreenshot[];
  downloadsHeading: string;
  downloadsIntro: string;
  downloads: ProductDownload[];
  installationHeading: string;
  installationSteps: ProductInstallationStep[];
  licenseHeading: string;
  licenseTerms: string[];
};

export const products: Product[] = contentData.products as Product[];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}
