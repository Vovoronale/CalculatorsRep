import Fuse from "fuse.js";

import {
  calculators,
  calculatorCategories,
  type Calculator,
  type CategorySlug,
} from "@/lib/calculators";

const fuseOptions = {
  keys: [
    { name: "title", weight: 0.5 },
    { name: "shortDescription", weight: 0.2 },
    { name: "useCases", weight: 0.2 },
    { name: "extraCategories", weight: 0.1 },
  ],
  threshold: 0.35,
  includeMatches: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
};

let fuseInstance: Fuse<Calculator> | null = null;

function getFuse(): Fuse<Calculator> {
  if (!fuseInstance) {
    fuseInstance = new Fuse(calculators, fuseOptions);
  }
  return fuseInstance;
}

export type SearchResult = {
  calculator: Calculator;
  score: number;
};

export type SearchGroup = {
  category: CategorySlug;
  categoryTitle: string;
  results: SearchResult[];
};

export function searchCalculators(query: string, limit = 12): SearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  return getFuse()
    .search(trimmed, { limit })
    .map((entry) => ({ calculator: entry.item, score: entry.score ?? 0 }));
}

export function groupSearchResults(results: SearchResult[]): SearchGroup[] {
  const buckets = new Map<CategorySlug, SearchResult[]>();
  for (const result of results) {
    const slug = result.calculator.mainCategory;
    if (!buckets.has(slug)) {
      buckets.set(slug, []);
    }
    buckets.get(slug)!.push(result);
  }

  const groups: SearchGroup[] = [];
  for (const category of calculatorCategories) {
    const list = buckets.get(category.slug);
    if (list && list.length > 0) {
      groups.push({
        category: category.slug,
        categoryTitle: category.title,
        results: list,
      });
    }
  }
  return groups;
}
