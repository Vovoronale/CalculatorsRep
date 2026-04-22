export type EmbedMode = "embed" | "external";
export type AccessLabel = "Вбудований розрахунок" | "Окремий інструмент";

export type CategorySlug =
  | "beton"
  | "fundamenti"
  | "stiny"
  | "pokrivlya"
  | "teploizolyatsiya"
  | "ozdoblennya";

export type CalculatorCategory = {
  slug: CategorySlug;
  title: string;
  note: string;
};

export type Calculator = {
  slug: string;
  title: string;
  shortDescription: string;
  mainCategory: CategorySlug;
  extraCategories: CategorySlug[];
  embedMode: EmbedMode;
  accessLabel: AccessLabel;
  embedUrl?: string;
  openUrl: string;
  order: number;
  seoTitle: string;
  seoDescription: string;
  editorialLabel?: "Новий" | "Популярний";
  useCases: string[];
};

const categoryDefinitions: CalculatorCategory[] = [
  {
    slug: "beton",
    title: "Бетон",
    note: "Монолітні елементи, кубатура й підбір бетонних об'ємів.",
  },
  {
    slug: "fundamenti",
    title: "Фундаменти",
    note: "Стрічкові та плитні рішення, бетон і базові параметри основи.",
  },
  {
    slug: "stiny",
    title: "Стіни",
    note: "Кладка, блоки й матеріальні обсяги для стінових елементів.",
  },
  {
    slug: "pokrivlya",
    title: "Покрівля",
    note: "Площа схилів, запас покриття й параметри покрівельних рішень.",
  },
  {
    slug: "teploizolyatsiya",
    title: "Теплоізоляція",
    note: "Товщина шарів, орієнтири для утеплення й енергоефективності.",
  },
  {
    slug: "ozdoblennya",
    title: "Оздоблення",
    note: "Плитка, суміші та чистові матеріали для оздоблювальних робіт.",
  },
];

export const calculatorCategories = categoryDefinitions;

export const calculators: Calculator[] = [
  {
    slug: "concrete-volume",
    title: "Калькулятор об'єму бетону",
    shortDescription:
      "Розрахунок кубатури бетону для плит, стяжок, ростверків і прямокутних заливок.",
    mainCategory: "beton",
    extraCategories: ["fundamenti"],
    embedMode: "embed",
    accessLabel: "Вбудований розрахунок",
    embedUrl: "https://www.calculator.net/concrete-calculator.html",
    openUrl: "https://www.calculator.net/concrete-calculator.html",
    order: 1,
    seoTitle: "Розрахунок об'єму бетону",
    seoDescription:
      "Калькулятор для визначення кубатури бетону при проектуванні плит, стяжок і монолітних елементів.",
    editorialLabel: "Популярний",
    useCases: ["Плити та стяжки", "Монолітні подушки", "Попередня відомість бетону"],
  },
  {
    slug: "strip-foundation",
    title: "Калькулятор стрічкового фундаменту",
    shortDescription:
      "Розрахунок стрічкового фундаменту за довжиною контуру, перерізом і витратою бетону.",
    mainCategory: "fundamenti",
    extraCategories: ["beton"],
    embedMode: "external",
    accessLabel: "Окремий інструмент",
    openUrl: "https://www.omnicalculator.com/construction/concrete-footing",
    order: 2,
    seoTitle: "Розрахунок стрічкового фундаменту",
    seoDescription:
      "Інструмент для попередньої оцінки геометрії стрічкового фундаменту та потреби в бетоні.",
    useCases: ["Стрічка під будинок", "Контур гаража", "Попередня оцінка бетонування"],
  },
  {
    slug: "brick-count",
    title: "Калькулятор кількості цегли",
    shortDescription:
      "Оцінка кількості цегли для зовнішніх стін, перегородок і облицювальних шарів.",
    mainCategory: "stiny",
    extraCategories: ["ozdoblennya"],
    embedMode: "embed",
    accessLabel: "Вбудований розрахунок",
    embedUrl: "https://www.calculator.net/brick-calculator.html",
    openUrl: "https://www.calculator.net/brick-calculator.html",
    order: 3,
    seoTitle: "Розрахунок кількості цегли",
    seoDescription:
      "Калькулятор для визначення орієнтовної кількості цегли при розрахунку стін і перегородок.",
    useCases: ["Зовнішні стіни", "Внутрішні перегородки", "Облицювальні шари"],
  },
  {
    slug: "roof-area",
    title: "Калькулятор площі покрівлі",
    shortDescription:
      "Розрахунок площі покрівлі, схилів і запасу матеріалу для закупівлі покриття.",
    mainCategory: "pokrivlya",
    extraCategories: [],
    embedMode: "embed",
    accessLabel: "Вбудований розрахунок",
    embedUrl: "https://www.omnicalculator.com/construction/roofing",
    openUrl: "https://www.omnicalculator.com/construction/roofing",
    order: 4,
    seoTitle: "Розрахунок площі покрівлі",
    seoDescription:
      "Інструмент для оцінки площі схилів, запасу покрівельного матеріалу й попередньої закупівлі.",
    editorialLabel: "Новий",
    useCases: ["Скатні покрівлі", "Підбір покриття", "Резерв на підрізування"],
  },
  {
    slug: "insulation-thickness",
    title: "Калькулятор товщини утеплення",
    shortDescription:
      "Орієнтир для підбору товщини утеплення в стінах, перекриттях і покрівельних вузлах.",
    mainCategory: "teploizolyatsiya",
    extraCategories: ["stiny"],
    embedMode: "external",
    accessLabel: "Окремий інструмент",
    openUrl: "https://www.omnicalculator.com/construction/insulation",
    order: 5,
    seoTitle: "Розрахунок товщини утеплення",
    seoDescription:
      "Калькулятор для попереднього підбору товщини теплоізоляції в основних огороджувальних конструкціях.",
    useCases: ["Фасадні стіни", "Покрівельні вузли", "Міжповерхові перекриття"],
  },
  {
    slug: "tile-layout",
    title: "Калькулятор плитки",
    shortDescription:
      "Розрахунок площі облицювання, кількості плитки й запасу на підрізування.",
    mainCategory: "ozdoblennya",
    extraCategories: [],
    embedMode: "external",
    accessLabel: "Окремий інструмент",
    openUrl: "https://www.calculator.net/tile-calculator.html",
    order: 6,
    seoTitle: "Розрахунок кількості плитки",
    seoDescription:
      "Інструмент для визначення кількості плитки та резерву матеріалу для облицювальних робіт.",
    editorialLabel: "Популярний",
    useCases: ["Санвузли", "Кухонні зони", "Підлога та фартухи"],
  },
];

export function getCalculatorBySlug(slug: string) {
  return calculators.find((calculator) => calculator.slug === slug);
}

export function getCalculatorsForCategory(categorySlug: CategorySlug) {
  return calculators
    .filter(
      (calculator) =>
        calculator.mainCategory === categorySlug ||
        calculator.extraCategories.includes(categorySlug),
    )
    .sort((left, right) => left.order - right.order);
}
