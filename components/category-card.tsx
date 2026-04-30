"use client";

import Link from "next/link";

import { getCategoryIcon } from "@/lib/icons";
import {
  getCalculatorsForCategory,
  type CalculatorCategory,
  type CategorySlug,
} from "@/lib/calculators";

type CategoryCardProps = {
  category: CalculatorCategory;
};

function pluralizeCalculators(count: number): string {
  const lastTwo = count % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return `${count} калькуляторів`;
  const last = count % 10;
  if (last === 1) return `${count} калькулятор`;
  if (last >= 2 && last <= 4) return `${count} калькулятори`;
  return `${count} калькуляторів`;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const Icon = getCategoryIcon(category.slug);
  const count = getCalculatorsForCategory(category.slug).length;

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    window.dispatchEvent(
      new CustomEvent<{ slug: CategorySlug }>("rail:expand", {
        detail: { slug: category.slug },
      }),
    );
  };

  return (
    <Link
      href={`/#${category.slug}`}
      className="category-card"
      aria-label={category.title}
      onClick={handleClick}
    >
      <span className="category-card__icon" aria-hidden>
        <Icon size={28} />
      </span>
      <h3 className="category-card__title">{category.title}</h3>
      <p className="category-card__desc">{category.note}</p>
      <p className="category-card__meta">{pluralizeCalculators(count)}</p>
    </Link>
  );
}
