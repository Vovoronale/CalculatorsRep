import {
  Bot,
  Box,
  BrickWall,
  Building,
  Calculator as CalculatorIcon,
  Drill,
  Grid3x3,
  Hammer,
  Home,
  Layers,
  Paintbrush,
  Pickaxe,
  Ruler,
  ShieldCheck,
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
  Bot,
  Box,
  BrickWall,
  Building,
  Calculator: CalculatorIcon,
  Drill,
  Grid3x3,
  Hammer,
  Home,
  Layers,
  Paintbrush,
  Pickaxe,
  Ruler,
  ShieldCheck,
  Square,
  Thermometer,
  Triangle,
  Wrench,
  Zap,
};

const FALLBACK_CATEGORY_ICONS: Record<CategorySlug, LucideIcon> = {
  beton: Box,
  teploizolyatsiya: Thermometer,
  teplotekhnika: Thermometer,
  normokontrol: ShieldCheck,
  "teplovi-vuzly": Grid3x3,
  konstruktsiyi: Triangle,
  "inzhenerni-merezhi": Zap,
  instrumenty: Wrench,
  "ai-asystenty": Bot,
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
