import contentData from "@/data/content.json";

export type CategorySlug =
  | "konstruktsiyi"
  | "zalizobeton"
  | "fundamenty"
  | "stalevi-konstruktsiyi"
  | "budivelna-mekhanika"
  | "mistobuduvannya-blahoustriy"
  | "normy-perevirky"
  | "normokontrol"
  | "klas-naslidkiv"
  | "dxf-geojson"
  | "inzhenerni-merezhi"
  | "elektryka"
  | "energoefektyvnist-teplotekhnika"
  | "ogorodzhuvalni-konstruktsiyi"
  | "pidlohy"
  | "teplovi-mistky-fem"
  | "ai-instrumenty"
  | "asystenty-dbn";

export type DisplayMode = "embed" | "external" | "modal" | "native";

export type EditorialLabel = "Новий" | "Популярний";

export type CalculatorCategory = {
  slug: CategorySlug;
  parentSlug?: CategorySlug;
  title: string;
  note: string;
  icon?: string;
};

export type CalculatorSeoContent = {
  task?: string;
  applications?: string[];
  inputParameters?: string[];
  formulas?: string[];
  example?: string;
  limitations?: string[];
  standards?: string[];
};

export type CalculatorSeoSection = {
  title: string;
  body?: string;
  items?: string[];
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
    | "concrete-exposure-class"
    | "concrete-cover-durability"
    | "soil-design-resistance"
    | "foundation-base-pressure"
    | "residential-yard-areas"
    | "steel-structure-category-group";
  accessLabel: string;
  embedUrl?: string;
  openUrl: string;
  order: number;
  seoTitle?: string;
  seoDescription?: string;
  seoContent?: CalculatorSeoContent;
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

export function buildCalculatorSeoMetadata(
  calculator: Calculator,
  brandName: string,
): { title: string; description: string } {
  const categoryTitle = getCalculatorCategoryTitle(calculator);

  return {
    title: `${calculator.title} | ${categoryTitle} | ${brandName}`,
    description: `${calculator.title} у категорії «${categoryTitle}»: ${calculator.shortDescription}`,
  };
}

export function getCalculatorSeoSections(
  calculator: Calculator,
): CalculatorSeoSection[] {
  const categoryTitle = getCalculatorCategoryTitle(calculator);
  const standards = nonEmptyItems(
    calculator.seoContent?.standards ?? splitStandards(calculator.standard),
  );

  return [
    {
      title: "Короткий опис задачі",
      body: calculator.seoContent?.task ?? calculator.shortDescription,
    },
    {
      title: "Де застосовується",
      items: nonEmptyItems(calculator.seoContent?.applications ?? calculator.useCases),
    },
    {
      title: "Вхідні параметри",
      items: nonEmptyItems(
        calculator.seoContent?.inputParameters ??
          getFallbackInputParameters(calculator, categoryTitle),
      ),
    },
    getFormulaSection(calculator),
    {
      title: "Приклад розрахунку",
      body:
        calculator.seoContent?.example ??
        `Наприклад, для задачі «${calculator.title}» інженер задає параметри з категорії «${categoryTitle}», запускає калькулятор і звіряє результат з нормативним контекстом: ${standards.join(" / ")}.`,
    },
    {
      title: "Обмеження",
      items: nonEmptyItems(
        calculator.seoContent?.limitations ?? [
          "Результат потрібно перевіряти у складі повного проектного розрахунку.",
          "Актуальність нормативів і вихідних даних залишається відповідальністю користувача.",
        ],
      ),
    },
    {
      title: "Нормативна база",
      items: standards,
    },
  ];
}

export function buildCalculatorStructuredData(
  calculator: Calculator,
  siteUrl: string,
  providerName: string,
) {
  const pageUrl = absoluteUrl(siteUrl, `/calculator/${calculator.slug}`);
  const categoryTrail = getCategoryTrail(calculator.mainCategory);

  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Каталог",
          item: absoluteUrl(siteUrl, "/"),
        },
        ...categoryTrail.map((category, index) => ({
          "@type": "ListItem",
          position: index + 2,
          name: category.title,
          item: absoluteUrl(siteUrl, `/#${category.slug}`),
        })),
        {
          "@type": "ListItem",
          position: categoryTrail.length + 2,
          name: calculator.title,
          item: pageUrl,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: calculator.title,
      applicationCategory: "EngineeringApplication",
      operatingSystem: "Web",
      url: pageUrl,
      description: calculator.shortDescription,
      provider: {
        "@type": "Organization",
        name: providerName,
      },
    },
  ];
}

function getCalculatorCategoryTitle(calculator: Calculator): string {
  return getCategoryBySlug(calculator.mainCategory)?.title ?? "Інженерні розрахунки";
}

function getFallbackInputParameters(
  calculator: Calculator,
  categoryTitle: string,
): string[] {
  if (calculator.displayMode === "native") {
    return [
      "Поля форми калькулятора з одиницями виміру та прийнятою розрахунковою схемою.",
      `Контекст категорії «${categoryTitle}» і нормативний документ: ${calculator.standard}.`,
    ];
  }

  if (calculator.displayMode === "embed" || calculator.displayMode === "modal") {
    return [
      "Вхідні дані вводяться у вбудованому інструменті відповідного сервісу.",
      `Для аудиту результату використовуйте категорію «${categoryTitle}» і нормативний документ: ${calculator.standard}.`,
    ];
  }

  return [
    "Вхідні параметри задаються у зовнішньому інженерному сервісі.",
    `Сторінка фіксує категорію «${categoryTitle}» і нормативний контекст: ${calculator.standard}.`,
  ];
}

function getFormulaSection(calculator: Calculator): CalculatorSeoSection {
  if (calculator.seoContent?.formulas && calculator.seoContent.formulas.length > 0) {
    return {
      title: "Формули та методика",
      items: nonEmptyItems(calculator.seoContent.formulas),
    };
  }

  return {
    title: "Формули та методика",
    body: `Методика розрахунку спирається на ${calculator.standard}. ${calculator.description ?? calculator.shortDescription}`,
  };
}

function splitStandards(standard: string): string[] {
  return standard.split(" / ");
}

function nonEmptyItems(items: string[]): string[] {
  return items.map((item) => item.trim()).filter(Boolean);
}

function absoluteUrl(siteUrl: string, path: string): string {
  return new URL(path, siteUrl).toString();
}
