export type AuthorProject = {
  slug: string;
  title: string;
  description: string;
  href: string;
};

export type ProjectCategory = {
  slug:
    | "engineering-calculations"
    | "design-and-norms"
    | "bim-tools"
    | "ai-products";
  title: string;
  description: string;
  projects: AuthorProject[];
};

export type AiAssistant = {
  slug: string;
  title: string;
  description: string;
  href: string;
};

export const projectCategories: ProjectCategory[] = [
  {
    slug: "engineering-calculations",
    title: "Інженерні розрахунки",
    description:
      "Розрахункові сервіси для енергоефективності, конструктивних перевірок, механіки та прикладних технічних оцінок.",
    projects: [
      {
        slug: "cadee-pro",
        title: "CadEE.pro",
        description:
          "Онлайн-сервіс теплотехнічних розрахунків огороджувальних конструкцій та оцінки енергоефективності за українськими нормами.",
        href: "https://cadee.pro",
      },
      {
        slug: "armcon",
        title: "ArmCon",
        description:
          "Розрахунок армування залізобетонних конструкцій за Єврокодами та українськими нормами.",
        href: "https://dbnassistant.com/products/armcon/",
      },
      {
        slug: "livebeamcalculator",
        title: "LiveBeamCalculator",
        description:
          "Онлайн-калькулятор балок для оцінки згинальних моментів, поперечних сил та прогинів.",
        href: "https://dbnassistant.com/products/livebeamcalculator/",
      },
      {
        slug: "power-calculator",
        title: "Розрахунок електричних навантажень будівель",
        description:
          "Сервіс для розрахунку електричних навантажень житлових і громадських будівель за ДБН В.2.5-23:2025.",
        href: "https://pc.dbnassistant.com",
      },
    ],
  },
  {
    slug: "design-and-norms",
    title: "Нормативні та проектні сервіси",
    description:
      "Інструменти для перевірки нормативів, підготовки документації, обробки даних і технічного супроводу проектної роботи.",
    projects: [
      {
        slug: "normcontrol",
        title: "NormControl",
        description: "Перевірка чинності нормативів у PDF з експортом результатів у CSV/JSON.",
        href: "https://nc.dbnassistant.com",
      },
      {
        slug: "iv-geojson",
        title: "IV GeoJSON",
        description: "Конвертація DXF у GeoJSON з геоприв'язкою до карти для GIS і державних сервісів.",
        href: "https://gj.dbnassistant.com",
      },
      {
        slug: "consequence-class",
        title: "Розрахунок класу наслідків",
        description:
          "Вебкалькулятор за ДСТУ 8855:2019 з покроковим журналом дій і експортом у PDF/DOCX.",
        href: "https://cc.dbnassistant.com",
      },
      {
        slug: "optcad",
        title: "OptCAD",
        description:
          "Середовище для оптимізації проектних рішень і прикладних інженерних сценаріїв.",
        href: "https://dbnassistant.com/author/",
      },
    ],
  },
  {
    slug: "bim-tools",
    title: "BIM та робочі інструменти",
    description:
      "Плагіни й утиліти для щоденної роботи всередині Revit та інших цифрових проектних процесів.",
    projects: [
      {
        slug: "revit-screenshot-plugin",
        title: "Revit Screenshot Plugin",
        description:
          "Плагін для Autodesk Revit з ручним та автоматичним створенням скриншотів.",
        href: "https://dbnassistant.com/products/revit-screenshot/",
      },
    ],
  },
  {
    slug: "ai-products",
    title: "AI та прикладні сервіси",
    description:
      "AI-інструменти для нормативної аналітики, швидких відповідей і підтримки технічних сценаріїв.",
    projects: [
      {
        slug: "dbn-assistant",
        title: "DBN Assistant",
        description:
          "Набір AI-асистентів на базі OpenAI/ChatGPT для аналізу будівельних норм і профільних запитів.",
        href: "https://dbnassistant.com/assistants",
      },
    ],
  },
];

export const aiAssistants: AiAssistant[] = [
  {
    slug: "dbn-v-2-2-5-2023",
    title: "ДБН В.2.2-5:2023",
    description: "Захисні споруди цивільного захисту.",
    href: "https://chatgpt.com/g/g-679fe1d48b6c8191a2b9b2dc0e38e431-dbn-v-2-2-5-2023",
  },
  {
    slug: "dbn-v-2-6-31-2021",
    title: "ДБН В.2.6-31:2021",
    description: "Теплова ізоляція та енергоефективність будівель.",
    href: "https://chatgpt.com/g/g-679f8359022c819185183f9d67dba80e-dbn-v-2-6-31-2021",
  },
  {
    slug: "dbn-v-1-1-7-2016",
    title: "ДБН В.1.1-7:2016",
    description: "Пожежна безпека об'єктів будівництва.",
    href: "https://chatgpt.com/g/g-679a43e723088191ba0208ec2f058393-dbn-v-1-1-7-2016",
  },
  {
    slug: "dbn-v-2-2-15-2019",
    title: "ДБН В.2.2-15:2019",
    description: "Житлові будинки. Основні положення.",
    href: "https://chatgpt.com/g/g-67a9239a7a28819197664b900dcb30e9-dbn-v-2-2-15-2019",
  },
  {
    slug: "dbn-v-2-5-67-2013",
    title: "ДБН В.2.5-67:2013",
    description: "Опалення, вентиляція та кондиціонування.",
    href: "https://chatgpt.com/g/g-67bb9c7d29e481919219dfe99e246a96-dbn-v-2-5-67-2013",
  },
];
