import contentData from "@/data/content.json";

export type CategorySlug =
  | "energoefektyvnist-teplotekhnika"
  | "ogorodzhuvalni-konstruktsiyi"
  | "pidlohy"
  | "voloha-tochka-rosy"
  | "temperatura-poverkhni"
  | "teplova-inertsiya"
  | "teplovi-mistky-fem"
  | "povitropronyknist"
  | "konstruktsiyi"
  | "zalizobeton"
  | "armatura"
  | "beton"
  | "balky-plyty"
  | "fundamenty"
  | "ankeruvannya"
  | "dovidkovi-tablytsi"
  | "normy-perevirky"
  | "normokontrol"
  | "klas-naslidkiv"
  | "perevirka-dbn"
  | "normatyvni-obgruntuvannya"
  | "ai-asystenty-z-norm"
  | "inzhenerni-merezhi"
  | "elektryka"
  | "opalennya"
  | "ventylyatsiya"
  | "vodopostachannya"
  | "enerhospozhyvannya"
  | "cad-gis-dani"
  | "dxf-geojson"
  | "konvertery"
  | "heometriya"
  | "import-eksport"
  | "dovidnyky"
  | "dovidnyk-beton"
  | "dovidnyk-armatura"
  | "materialy"
  | "normatyvni-kharakterystyky"
  | "ai-instrumenty"
  | "asystenty-dbn"
  | "asystenty-perevirky-rishen"
  | "asystenty-pidhotovky-poyasnen";

export type DisplayMode = "embed" | "external" | "modal" | "native";

export type EditorialLabel = "Новий" | "Популярний";

export type CalculatorCategory = {
  slug: CategorySlug;
  parentSlug?: CategorySlug;
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
    | "minimum-reinforcement-area"
    | "foundation-bar-anchorage"
    | "cassoon-load-distribution"
    | "soil-design-resistance";
  accessLabel: string;
  embedUrl?: string;
  openUrl: string;
  order: number;
  seoTitle: string;
  seoDescription: string;
  standard: string;
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

export function getDirectCalculatorsForCategory(categorySlug: CategorySlug): Calculator[] {
  return calculators
    .filter(
      (calculator) =>
        calculator.mainCategory === categorySlug ||
        calculator.extraCategories.includes(categorySlug),
    )
    .sort((left, right) => left.order - right.order);
}

export function getDescendantCategorySlugs(categorySlug: CategorySlug): CategorySlug[] {
  const children = getChildCategories(categorySlug);

  return children.flatMap((child) => [
    child.slug,
    ...getDescendantCategorySlugs(child.slug),
  ]);
}

export function getCalculatorsForCategory(categorySlug: CategorySlug): Calculator[] {
  const categorySlugs = new Set([
    categorySlug,
    ...getDescendantCategorySlugs(categorySlug),
  ]);

  return calculators
    .filter(
      (calculator) =>
        categorySlugs.has(calculator.mainCategory) ||
        calculator.extraCategories.some((extraCategory) =>
          categorySlugs.has(extraCategory),
        ),
    )
    .sort((left, right) => left.order - right.order);
}

export function getCategoryBySlug(slug: CategorySlug): CalculatorCategory | undefined {
  return calculatorCategories.find((category) => category.slug === slug);
}

export function getChildCategories(parentSlug: CategorySlug): CalculatorCategory[] {
  return calculatorCategories.filter((category) => category.parentSlug === parentSlug);
}

export function getCategoryTrail(slug: CategorySlug): CalculatorCategory[] {
  const category = getCategoryBySlug(slug);
  if (!category) return [];
  if (!category.parentSlug) return [category];
  return [...getCategoryTrail(category.parentSlug), category];
}
