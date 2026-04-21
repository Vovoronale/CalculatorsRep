export type AuthorProject = {
  slug: string;
  title: string;
  description: string;
  href: string;
  source: "products" | "author";
};

export const authorProjects: AuthorProject[] = [
  {
    slug: "cadee-pro",
    title: "CadEE.pro",
    description:
      "Онлайн-сервіс теплотехнічних розрахунків огороджувальних конструкцій та оцінки енергоефективності за українськими нормами.",
    href: "https://cadee.pro",
    source: "products",
  },
  {
    slug: "armcon",
    title: "ArmCon",
    description:
      "Розрахунок армування залізобетонних конструкцій за Єврокодами та українськими нормами.",
    href: "https://dbnassistant.com/products/armcon/",
    source: "products",
  },
  {
    slug: "livebeamcalculator",
    title: "LiveBeamCalculator",
    description:
      "Онлайн-калькулятор балок для розрахунку згинальних моментів, поперечних сил та прогинів.",
    href: "https://dbnassistant.com/products/livebeamcalculator/",
    source: "products",
  },
  {
    slug: "optcad",
    title: "OptCAD",
    description: "Оптимізація проєктних рішень.",
    href: "https://dbnassistant.com/author/",
    source: "author",
  },
  {
    slug: "dbn-assistant",
    title: "DBN Assistant",
    description:
      "ШІ-асистенти на базі MyGPT/OpenAI для первинного аналізу будівельних норм із підтримкою UA/EN.",
    href: "https://dbnassistant.com/",
    source: "products",
  },
  {
    slug: "normcontrol",
    title: "NormControl",
    description:
      "Перевірка чинності нормативів у PDF з експортом результатів у CSV/JSON.",
    href: "https://nc.dbnassistant.com",
    source: "products",
  },
  {
    slug: "iv-geojson",
    title: "IV GeoJSON",
    description:
      "Конвертація DXF у GeoJSON з геоприв'язкою до карти для GIS і державних сервісів.",
    href: "https://gj.dbnassistant.com",
    source: "products",
  },
  {
    slug: "consequence-class",
    title: "Розрахунок класу наслідків",
    description:
      "Вебкалькулятор за ДСТУ 8855:2019 з покроковим журналом дій і експортом у PDF/DOCX.",
    href: "https://cc.dbnassistant.com",
    source: "products",
  },
  {
    slug: "revit-screenshot-plugin",
    title: "Revit Screenshot Plugin",
    description:
      "Плагін для Autodesk Revit з ручним та автоматичним створенням скриншотів.",
    href: "https://dbnassistant.com/products/revit-screenshot/",
    source: "products",
  },
];
