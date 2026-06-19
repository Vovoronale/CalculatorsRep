import {
  Activity,
  ArrowLeftRight,
  BadgeCheck,
  Bot,
  Box,
  BrickWall,
  BookOpen,
  BookOpenCheck,
  Building,
  Calculator as CalculatorIcon,
  Drill,
  Droplets,
  Fan,
  FileCheck2,
  FileText,
  Flame,
  Gauge,
  Hammer,
  Home,
  Layers,
  LandPlot,
  Map,
  MapPinned,
  Network,
  Paintbrush,
  Pickaxe,
  Replace,
  Ruler,
  ScanSearch,
  ShieldCheck,
  Shapes,
  Square,
  Table2,
  Thermometer,
  Triangle,
  Wind,
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
  Activity,
  ArrowLeftRight,
  BadgeCheck,
  Bot,
  Box,
  BrickWall,
  BookOpen,
  BookOpenCheck,
  Building,
  Calculator: CalculatorIcon,
  Drill,
  Droplets,
  Fan,
  FileCheck2,
  FileText,
  Flame,
  Gauge,
  Hammer,
  Home,
  Layers,
  LandPlot,
  Map,
  MapPinned,
  Network,
  Paintbrush,
  Pickaxe,
  Replace,
  Ruler,
  ScanSearch,
  ShieldCheck,
  Shapes,
  Square,
  Table2,
  Thermometer,
  Triangle,
  Wind,
  Wrench,
  Zap,
};

const FALLBACK_CATEGORY_ICONS: Record<CategorySlug, LucideIcon> = {
  "energoefektyvnist-teplotekhnika": Thermometer,
  "ogorodzhuvalni-konstruktsiyi": BrickWall,
  pidlohy: Layers,
  "teplovi-mistky-fem": Network,
  konstruktsiyi: Triangle,
  zalizobeton: Building,
  fundamenty: Home,
  "stalevi-konstruktsiyi": Hammer,
  "budivelna-mekhanika": Activity,
  "mistobuduvannya-blahoustriy": MapPinned,
  "normy-perevirky": ShieldCheck,
  normokontrol: ShieldCheck,
  "klas-naslidkiv": BadgeCheck,
  "perevirka-dbn": FileCheck2,
  "normatyvni-obgruntuvannya": BookOpenCheck,
  "inzhenerni-merezhi": Zap,
  elektryka: Zap,
  "cad-gis-dani": Map,
  "dxf-geojson": Map,
  "ai-instrumenty": Bot,
  "asystenty-dbn": Bot,
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
