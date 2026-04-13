export type EmbedMode = "embed" | "external";

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
    note: "Об'єми, заливка і базові будівельні суміші.",
  },
  {
    slug: "fundamenti",
    title: "Фундаменти",
    note: "Стрічка, плита і підготовка основи.",
  },
  {
    slug: "stiny",
    title: "Стіни",
    note: "Цегла, блоки і конструктивні матеріали.",
  },
  {
    slug: "pokrivlya",
    title: "Покрівля",
    note: "Площа, нахил і покрівельний запас.",
  },
  {
    slug: "teploizolyatsiya",
    title: "Теплоізоляція",
    note: "Товщина, щільність і витрати утеплення.",
  },
  {
    slug: "ozdoblennya",
    title: "Оздоблення",
    note: "Плитка, сухі суміші та чистові роботи.",
  },
];

export const calculatorCategories = categoryDefinitions;

export const calculators: Calculator[] = [
  {
    slug: "concrete-volume",
    title: "Калькулятор об'єму бетону",
    shortDescription: "Швидкий підрахунок кубатури для плит, стяжок і прямокутних заливок.",
    mainCategory: "beton",
    extraCategories: ["fundamenti"],
    embedMode: "embed",
    embedUrl: "https://www.calculator.net/concrete-calculator.html",
    openUrl: "https://www.calculator.net/concrete-calculator.html",
    order: 1,
    seoTitle: "Калькулятор об'єму бетону",
    seoDescription: "Порахуйте кубатуру бетону для плит, стяжок і фундаментних елементів.",
    editorialLabel: "Популярний",
    useCases: ["Плита перекриття", "Стяжка", "Прямокутна заливка"],
  },
  {
    slug: "strip-foundation",
    title: "Калькулятор стрічкового фундаменту",
    shortDescription: "Об'єм бетону, довжина стрічки і базова витрата для фундаментного контуру.",
    mainCategory: "fundamenti",
    extraCategories: ["beton"],
    embedMode: "external",
    openUrl: "https://www.omnicalculator.com/construction/concrete-footing",
    order: 2,
    seoTitle: "Калькулятор стрічкового фундаменту",
    seoDescription: "Оцініть параметри стрічкового фундаменту і витрати на заливку.",
    useCases: ["Приватний будинок", "Гараж", "Господарські споруди"],
  },
  {
    slug: "brick-count",
    title: "Калькулятор кількості цегли",
    shortDescription: "Порахуйте орієнтовну кількість цегли для стін з урахуванням площі та формату.",
    mainCategory: "stiny",
    extraCategories: ["ozdoblennya"],
    embedMode: "embed",
    embedUrl: "https://www.calculator.net/brick-calculator.html",
    openUrl: "https://www.calculator.net/brick-calculator.html",
    order: 3,
    seoTitle: "Калькулятор кількості цегли",
    seoDescription: "Орієнтовний підрахунок кількості цегли для стін і перегородок.",
    useCases: ["Зовнішні стіни", "Перегородки", "Облицювання"],
  },
  {
    slug: "roof-area",
    title: "Калькулятор площі покрівлі",
    shortDescription: "Розрахунок площі схилів і запасу матеріалу для дахових робіт.",
    mainCategory: "pokrivlya",
    extraCategories: [],
    embedMode: "embed",
    embedUrl: "https://www.omnicalculator.com/construction/roofing",
    openUrl: "https://www.omnicalculator.com/construction/roofing",
    order: 4,
    seoTitle: "Калькулятор площі покрівлі",
    seoDescription: "Площа покрівлі, запас покриття та орієнтир для закупівлі матеріалу.",
    editorialLabel: "Новий",
    useCases: ["Металочерепиця", "Бітумна черепиця", "Профнастил"],
  },
  {
    slug: "insulation-thickness",
    title: "Калькулятор товщини утеплення",
    shortDescription: "Швидкий орієнтир для підбору товщини утеплювача під стіни та перекриття.",
    mainCategory: "teploizolyatsiya",
    extraCategories: ["stiny"],
    embedMode: "external",
    openUrl: "https://www.omnicalculator.com/construction/insulation",
    order: 5,
    seoTitle: "Калькулятор товщини утеплення",
    seoDescription: "Оцініть потрібну товщину утеплювача для різних конструкцій.",
    useCases: ["Фасад", "Покрівельний пиріг", "Перекриття"],
  },
  {
    slug: "tile-layout",
    title: "Калькулятор плитки",
    shortDescription: "Площа облицювання, кількість плитки та запас на підрізку.",
    mainCategory: "ozdoblennya",
    extraCategories: [],
    embedMode: "external",
    openUrl: "https://www.calculator.net/tile-calculator.html",
    order: 6,
    seoTitle: "Калькулятор плитки",
    seoDescription: "Порахуйте кількість плитки та запас для оздоблювальних робіт.",
    editorialLabel: "Популярний",
    useCases: ["Санвузол", "Кухня", "Підлога"],
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
