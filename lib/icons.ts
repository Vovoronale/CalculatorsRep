import {
  Box,
  BrickWall,
  Building,
  Calculator as CalculatorIcon,
  Drill,
  Hammer,
  Home,
  Layers,
  Paintbrush,
  Pickaxe,
  Ruler,
  Square,
  Thermometer,
  Triangle,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  calculatorCategories,
  type Calculator,
  type CategorySlug,
} from "@/lib/calculators";

export const iconRegistry: Record<string, LucideIcon> = {
  Box,
  BrickWall,
  Building,
  Calculator: CalculatorIcon,
  Drill,
  Hammer,
  Home,
  Layers,
  Paintbrush,
  Pickaxe,
  Ruler,
  Square,
  Thermometer,
  Triangle,
  Wrench,
  Zap,
};

const FALLBACK_CATEGORY_ICONS: Record<CategorySlug, LucideIcon> = {
  beton: Box,
  fundamenti: Layers,
  stiny: BrickWall,
  pokrivlya: Home,
  teploizolyatsiya: Thermometer,
  ozdoblennya: Paintbrush,
};

export function getCategoryIcon(slug: CategorySlug): LucideIcon {
  const category = calculatorCategories.find((entry) => entry.slug === slug);
  if (category?.icon && iconRegistry[category.icon]) {
    return iconRegistry[category.icon];
  }
  return FALLBACK_CATEGORY_ICONS[slug] ?? Box;
}

export function getCalculatorIcon(calculator: Calculator): LucideIcon {
  if (calculator.icon && iconRegistry[calculator.icon]) {
    return iconRegistry[calculator.icon];
  }
  return getCategoryIcon(calculator.mainCategory);
}
