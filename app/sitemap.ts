import type { MetadataRoute } from "next";

import { calculators } from "@/lib/calculators";
import { legalPages } from "@/lib/legal-pages";

const siteUrl = "https://ivapps.pro";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/author`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...legalPages.map((page) => ({
      url: `${siteUrl}/${page.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.4,
    })),
    ...calculators.map((calculator) => ({
      url: `${siteUrl}/calculator/${calculator.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
