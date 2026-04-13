import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { CalculatorShell } from "@/components/calculator-shell";
import { calculators, getCalculatorBySlug } from "@/lib/calculators";
import { siteContent } from "@/lib/site-content";

type CalculatorPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = false;

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

  return {
    title: `${calculator.seoTitle} | ${siteContent.brand.productName}`,
    description: calculator.seoDescription,
  };
}

export default async function CalculatorPage({ params }: CalculatorPageProps) {
  const { slug } = await params;
  const calculator = getCalculatorBySlug(slug);

  if (!calculator) {
    notFound();
  }

  return <CalculatorShell selectedCalculator={calculator} />;
}
