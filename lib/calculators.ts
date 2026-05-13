import contentData from "@/data/content.json";

export type CategorySlug =
  | "teplotekhnika"
  | "normokontrol"
  | "konstruktsiyi"
  | "inzhenerni-merezhi"
  | "instrumenty"
  | "ai-asystenty";

export type DisplayMode = "embed" | "external" | "modal" | "native";

export type EditorialLabel = "Новий" | "Популярний";

export type CalculatorCategory = {
  slug: CategorySlug;
  title: string;
  note: string;
  icon?: string;
};

export type Calculator = {
  slug: string;
  title: string;
  shortDescription: string;
  description?: string;
  mainCategory: CategorySlug;
  extraCategories: CategorySlug[];
  displayMode: DisplayMode;
  nativeCalculator?:
    | "rebar-area-bars"
    | "rebar-characteristics"
    | "concrete-characteristics"
    | "minimum-reinforcement-area";
  accessLabel: string;
  embedUrl?: string;
  openUrl: string;
  order: number;
  seoTitle: string;
  seoDescription: string;
  editorialLabel?: EditorialLabel;
  useCases: string[];
  tags?: string[];
  tools?: string[];
  icon?: string;
};

export const calculatorCategories = contentData.categories as CalculatorCategory[];

export const calculators = (contentData.calculators as Calculator[])
  .slice()
  .sort((left, right) => left.order - right.order);

export function getCalculatorBySlug(slug: string): Calculator | undefined {
  return calculators.find((calculator) => calculator.slug === slug);
}

export function getCalculatorsForCategory(categorySlug: CategorySlug): Calculator[] {
  return calculators
    .filter(
      (calculator) =>
        calculator.mainCategory === categorySlug ||
        calculator.extraCategories.includes(categorySlug),
    )
    .sort((left, right) => left.order - right.order);
}

export function getCategoryBySlug(slug: CategorySlug): CalculatorCategory | undefined {
  return calculatorCategories.find((category) => category.slug === slug);
}
