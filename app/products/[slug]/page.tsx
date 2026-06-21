import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductView } from "@/components/product-view";
import { getProductBySlug, products } from "@/lib/products";
import { siteContent } from "@/lib/site-content";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      title: siteContent.brand.productName,
    };
  }

  return {
    title: product.seoTitle,
    description: product.seoDescription,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <ProductView product={product} />;
}
