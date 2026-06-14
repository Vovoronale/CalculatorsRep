import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { CalculatorShell } from "@/components/calculator-shell";
import {
  buildCalculatorSeoMetadata,
  buildCalculatorStructuredData,
  calculators,
  getCalculatorBySlug,
} from "@/lib/calculators";
import { siteContent } from "@/lib/site-content";

type CalculatorPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = false;

const siteUrl = "https://ivapps.pro";

export async function generateStaticParams() {
  return calculators.map((calculator) => ({
    slug: calculator.slug,
  }));
}

export async function generateMetadata({
  params,
}: CalculatorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const calculator = getCalculatorBySlug(slug);

  if (!calculator) {
    return {
      title: siteContent.brand.productName,
    };
  }

  const metadata = buildCalculatorSeoMetadata(
    calculator,
    siteContent.brand.umbrella,
  );

  return {
    title: metadata.title,
    description: metadata.description,
  };
}

export default async function CalculatorPage({ params }: CalculatorPageProps) {
  const { slug } = await params;
  const calculator = getCalculatorBySlug(slug);

  if (!calculator) {
    notFound();
  }

  const structuredData = buildCalculatorStructuredData(
    calculator,
    siteUrl,
    siteContent.brand.umbrella,
  );

  return (
    <>
      {structuredData.map((item) => (
        <script
          key={item["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, "\\u003c"),
          }}
        />
      ))}
      <CalculatorShell selectedCalculator={calculator} />
    </>
  );
}
