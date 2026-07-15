export const CONCRETE_EXPOSURE_CLASS_SOURCE =
  "ДБН В.2.6-98:2009 / ДСТУ ENV/EN 206";

export type CoverExposureClass =
  | "X0"
  | "XC1"
  | "XC2"
  | "XC3"
  | "XC4"
  | "XD1"
  | "XD2"
  | "XD3"
  | "XS1"
  | "XS2"
  | "XS3";

export type DbnTable41ExposureClass =
  | Exclude<CoverExposureClass, "XS1" | "XS2" | "XS3">
  | "XF1"
  | "XF2"
  | "XF3"
  | "XF4"
  | "XA1"
  | "XA2"
  | "XA3";

export type ExposureClass =
  | CoverExposureClass
  | "XF1"
  | "XF2"
  | "XF3"
  | "XF4"
  | "XA1"
  | "XA2"
  | "XA3";

export type ConcreteExposureElementType =
  | "slab"
  | "beam"
  | "column"
  | "wall"
  | "foundation"
  | "retaining_wall"
  | "tank"
  | "other";

export type ReinforcementPresence =
  | "reinforced_or_embedded_metal"
  | "plain_concrete_without_metal";

export type CarbonationExposureRow = "X0" | "XC1" | "XC2" | "XC3" | "XC4";
export type XdExposureRow = "none" | "XD1" | "XD2" | "XD3";
export type XsExposureRow = "none" | "XS1" | "XS2" | "XS3";
export type XfExposureRow = "none" | "XF1" | "XF2" | "XF3" | "XF4";
export type XaExposureRow =
  | "none"
  | "XA1"
  | "XA2"
  | "XA3"
  | "unknown_requires_classification";

export type ConcreteExposureClassInput = {
  elementName: string;
  elementType: ConcreteExposureElementType;
  reinforcementPresence: ReinforcementPresence;
  carbonationExposureRow: CarbonationExposureRow;
  xdExposureRow: XdExposureRow;
  xsExposureRow: XsExposureRow;
  xfExposureRow: XfExposureRow;
  xaExposureRow: XaExposureRow;
  hasChemicalAggressivenessConfirmation: boolean;
  currentExposureClass?: CoverExposureClass;
};

export type DbnMinimumConcreteClass = {
  exposureClass: DbnTable41ExposureClass;
  minimumConcreteClass: string;
};

export type ConcreteExposureClassValues = {
  exposureClasses: ExposureClass[];
  governingCoverExposureClass: CoverExposureClass;
  dbnMinimumConcreteClasses: DbnMinimumConcreteClass[];
  additionalDurabilityRequirements: string[];
};

export type ConcreteExposureClassReportStep = {
  key:
    | "inputs"
    | "x0-xc"
    | "xd-chlorides"
    | "xs-marine-chlorides"
    | "xf-freeze-thaw"
    | "xa-chemical-attack"
    | "class-set"
    | "dbn-minimum-concrete"
    | "governing-cover-class"
    | "additional-requirements"
    | "conclusion";
  caption: string;
  items?: string[];
  notes?: string[];
  formula?: string;
  formulas?: string[];
};

export type ConcreteExposureClassReport = {
  input: ConcreteExposureClassInput;
  valid: boolean;
  errors: string[];
  warnings: string[];
  values: ConcreteExposureClassValues | null;
  steps: ConcreteExposureClassReportStep[];
};

export const DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT: ConcreteExposureClassInput = {
  elementName: "Елемент",
  elementType: "column",
  reinforcementPresence: "reinforced_or_embedded_metal",
  carbonationExposureRow: "X0",
  xdExposureRow: "none",
  xsExposureRow: "none",
  xfExposureRow: "none",
  xaExposureRow: "none",
  hasChemicalAggressivenessConfirmation: false,
};

const ELEMENT_TYPE_LABELS: Record<ConcreteExposureElementType, string> = {
  slab: "плита",
  beam: "балка",
  column: "колона",
  wall: "стіна",
  foundation: "фундамент",
  retaining_wall: "підпірна стіна",
  tank: "резервуар",
  other: "інший елемент",
};

const REINFORCEMENT_PRESENCE_LABELS: Record<ReinforcementPresence, string> = {
  reinforced_or_embedded_metal:
    "залізобетон або бетон з металевими закладними",
  plain_concrete_without_metal: "бетон без арматури і металевих закладних",
};

type DbnRow = {
  exposureClass: DbnTable41ExposureClass;
  characteristic: string;
  example: string;
  minimumConcreteClass: string;
};

const DBN_TABLE_41_ROWS: Record<DbnTable41ExposureClass, DbnRow> = {
  X0: {
    exposureClass: "X0",
    characteristic:
      "Відсутнє поперемінно заморожування-відтавання, хімічні дії, стирання тощо. Дуже сухий повітряно-вологісний режим (RH <= 30 %).",
    example:
      "Конструкції всередині приміщень із сухим режимом згідно з ДБН В.1.2-2 та ДСТУ Б В.2.6-145.",
    minimumConcreteClass: "C8/10",
  },
  XC1: {
    exposureClass: "XC1",
    characteristic:
      "Сухий повітряно-вологісний режим (30 % < RH <= 60 %) або постійна експлуатація у вологонасиченому стані.",
    example:
      "Конструкції всередині приміщень із нормальним режимом згідно з ДБН В.1.2-2 та ДСТУ Б В.2.6-145; конструкції, які постійно знаходяться в грунті або під водою.",
    minimumConcreteClass: "C12/15",
  },
  XC2: {
    exposureClass: "XC2",
    characteristic: "Водонасичений стан при епізодичному висушуванні.",
    example:
      "Поверхні бетону, які тривалий час контактують з водою; фундаменти.",
    minimumConcreteClass: "C16/20",
  },
  XC3: {
    exposureClass: "XC3",
    characteristic:
      "Помірний повітряно-вологісний режим (60 % < RH <= 75 %) або експлуатація в умовах епізодичного вологонасичення.",
    example:
      "Конструкції всередині приміщень із вологим режимом; зовнішні конструкції, захищені від дощу.",
    minimumConcreteClass: "C20/25",
  },
  XC4: {
    exposureClass: "XC4",
    characteristic: "Поперемінне зволоження та висушування.",
    example:
      "Поверхні бетону, що контактують з водою, але не належать до класу XC2.",
    minimumConcreteClass: "C25/30",
  },
  XD1: {
    exposureClass: "XD1",
    characteristic:
      "Вологий, в умовах повітряно-вологісного стану (RH > 75 %) за відсутності епізодичного водонасичення.",
    example: "Поверхні бетону, що зазнають дії хлоридів з повітря.",
    minimumConcreteClass: "C25/30",
  },
  XD2: {
    exposureClass: "XD2",
    characteristic: "У водонасиченому стані.",
    example: "Елементи басейнів; бетон, що контактує з промисловими водами.",
    minimumConcreteClass: "C30/35",
  },
  XD3: {
    exposureClass: "XD3",
    characteristic: "Поперемінне зволоження і висушування.",
    example:
      "Елементи мостів, що зазнають дії бризок з хлоридами; покриття автостоянок.",
    minimumConcreteClass: "C30/35",
  },
  XF1: {
    exposureClass: "XF1",
    characteristic:
      "Епізодичне водонасичення, дія від'ємних температур за відсутності антиобморожувачів.",
    example: "Вертикальні поверхні, що зазнають дощу та замерзання.",
    minimumConcreteClass: "C25/30",
  },
  XF2: {
    exposureClass: "XF2",
    characteristic: "Те саме, у присутності антиобморожувачів.",
    example:
      "Вертикальні поверхні дорожніх споруд, що зазнають дії антиобморожувачів.",
    minimumConcreteClass: "C20/25",
  },
  XF3: {
    exposureClass: "XF3",
    characteristic: "Водонасичений стан, антиобморожувачі не застосовують.",
    example:
      "Горизонтальні поверхні, що зазнають дощу та замерзання.",
    minimumConcreteClass: "C25/30",
  },
  XF4: {
    exposureClass: "XF4",
    characteristic: "Водонасичений стан, застосовують антиобморожувачі.",
    example:
      "Дорожні та мостові конструкції, що зазнають дії антиобморожувачів.",
    minimumConcreteClass: "C25/30",
  },
  XA1: {
    exposureClass: "XA1",
    characteristic: "Слабоагресивне середовище.",
    example:
      "Середовище з хімічною агресивністю, класифікованою за ДСТУ Б В.2.6-145.",
    minimumConcreteClass: "C25/30",
  },
  XA2: {
    exposureClass: "XA2",
    characteristic: "Середньоагресивне середовище.",
    example:
      "Середовище з хімічною агресивністю, класифікованою за ДСТУ Б В.2.6-145.",
    minimumConcreteClass: "C25/30",
  },
  XA3: {
    exposureClass: "XA3",
    characteristic: "Сильноагресивне середовище.",
    example:
      "Середовище з хімічною агресивністю, класифікованою за ДСТУ Б В.2.6-145.",
    minimumConcreteClass: "C30/35",
  },
};

const XS_ROW_LABELS: Record<Exclude<XsExposureRow, "none">, string> = {
  XS1: "Повітря з морськими солями, але без прямого контакту з морською водою.",
  XS2: "Постійне занурення у морську воду.",
  XS3: "Зони припливу, бризок або розпилення морської води.",
};

const COVER_EXPOSURE_RANK: Record<CoverExposureClass, number> = {
  X0: 0,
  XC1: 1,
  XC2: 2,
  XC3: 2,
  XC4: 3,
  XD1: 4,
  XS1: 4,
  XD2: 5,
  XS2: 5,
  XD3: 6,
  XS3: 6,
};

const COVER_EXPOSURE_ORDER: CoverExposureClass[] = [
  "X0",
  "XC1",
  "XC2",
  "XC3",
  "XC4",
  "XD1",
  "XS1",
  "XD2",
  "XS2",
  "XD3",
  "XS3",
];

const EXPOSURE_CLASS_OUTPUT_ORDER: ExposureClass[] = [
  "X0",
  "XC1",
  "XC2",
  "XC3",
  "XC4",
  "XD1",
  "XD2",
  "XD3",
  "XS1",
  "XS2",
  "XS3",
  "XF1",
  "XF2",
  "XF3",
  "XF4",
  "XA1",
  "XA2",
  "XA3",
];

const XF_REQUIREMENT =
  "Для класу XF необхідно перевірити вимоги до морозостійкості бетону, водонасичення, водонепроникності, повітровтягування та складу бетонної суміші.";
const XA_REQUIREMENT =
  "Для класу XA необхідно перевірити хімічну агресивність середовища та потребу у спеціальному захисті бетону.";
const X0_AGGRESSIVE_WARNING =
  "Для X0 агресивні дії мають бути відсутні; вибрані додаткові класи впливу перевірте на сумісність із рядком X0 таблиці 4.1.";
const XA_CLASSIFICATION_WARNING =
  "Для визначення класу XA потрібна класифікація агресивності середовища за ДСТУ Б В.2.6-145.";
const XA_CONFIRMATION_WARNING =
  "Клас XA прийнято за вибором користувача. Для остаточного призначення класу хімічної агресії потрібне підтвердження агресивності середовища за ДСТУ Б В.2.6-145.";

function addUnique<T>(items: T[], item: T | null): void {
  if (item !== null && !items.includes(item)) {
    items.push(item);
  }
}

function isCoverExposureClass(cls: ExposureClass): cls is CoverExposureClass {
  return COVER_EXPOSURE_ORDER.includes(cls as CoverExposureClass);
}

function isDbnTable41ExposureClass(
  cls: ExposureClass,
): cls is DbnTable41ExposureClass {
  return cls in DBN_TABLE_41_ROWS;
}

function getGoverningCoverExposureClass(
  classes: ExposureClass[],
): CoverExposureClass | null {
  const candidates = COVER_EXPOSURE_ORDER.filter((cls) =>
    classes.includes(cls),
  );
  if (candidates.length === 0) return null;

  return candidates.reduce((selected, candidate) =>
    COVER_EXPOSURE_RANK[candidate] > COVER_EXPOSURE_RANK[selected]
      ? candidate
      : selected,
  );
}

function sortExposureClasses(classes: ExposureClass[]): ExposureClass[] {
  return EXPOSURE_CLASS_OUTPUT_ORDER.filter((cls) => classes.includes(cls));
}

function formatClasses(classes: string[]): string {
  return classes.join(", ");
}

function formatBooleanLabel(value: boolean): string {
  return value ? "так" : "ні";
}

function formatDbnRowItems(row: DbnRow): string[] {
  return [
    `Рядок таблиці 4.1: ${row.exposureClass}`,
    `Характеристика середовища: ${row.characteristic}`,
    `Приклад з таблиці 4.1: ${row.example}`,
    `Мінімальний клас бетону за таблицею 4.1: ${row.minimumConcreteClass}`,
  ];
}

function buildInputStep(
  input: ConcreteExposureClassInput,
): ConcreteExposureClassReportStep {
  const items = [
    `Назва елемента: ${input.elementName}`,
    `Тип елемента: ${ELEMENT_TYPE_LABELS[input.elementType]}`,
    `Армування або металеві закладні: ${
      REINFORCEMENT_PRESENCE_LABELS[input.reinforcementPresence]
    }`,
    `Рядок X0/XC таблиці 4.1: ${input.carbonationExposureRow}`,
    `Рядок XD таблиці 4.1: ${input.xdExposureRow === "none" ? "не застосовується" : input.xdExposureRow}`,
    `Клас XS за ДСТУ ENV/EN 206: ${input.xsExposureRow === "none" ? "не застосовується" : input.xsExposureRow}`,
    `Рядок XF таблиці 4.1: ${input.xfExposureRow === "none" ? "не застосовується" : input.xfExposureRow}`,
    `Рядок XA таблиці 4.1: ${input.xaExposureRow === "none" ? "не застосовується" : input.xaExposureRow}`,
  ];

  if (input.xaExposureRow !== "none") {
    items.push(
      `Підтвердження агресивності середовища за ДСТУ Б В.2.6-145: ${formatBooleanLabel(
        input.hasChemicalAggressivenessConfirmation,
      )}`,
    );
  }

  if (input.currentExposureClass) {
    items.push(
      `Поточний клас у розрахунку захисного шару: ${input.currentExposureClass}`,
    );
  }

  return {
    key: "inputs",
    caption:
      "Вихідні дані для визначення класів впливу середовища (ДБН В.2.6-98:2009, розділ 4.3, таблиця 4.1; ДСТУ ENV/EN 206 для XS):",
    items,
    formula: "класи впливу = f(X0/XC; XD; XS; XF; XA)",
  };
}

function buildX0XcStep(
  rowKey: CarbonationExposureRow,
): ConcreteExposureClassReportStep {
  const row = DBN_TABLE_41_ROWS[rowKey];

  return {
    key: "x0-xc",
    caption:
      "Визначення класу X0/XC за карбонізацією або відсутністю агресивних дій (ДБН В.2.6-98:2009, таблиця 4.1, рядки X0, XC1-XC4):",
    items: formatDbnRowItems(row),
    formula: `X0/XC = рядок таблиці 4.1: ${row.characteristic} => ${row.exposureClass}`,
  };
}

function buildXdStep(rowKey: XdExposureRow): ConcreteExposureClassReportStep {
  if (rowKey === "none") {
    return {
      key: "xd-chlorides",
      caption:
        "Визначення класу дії хлоридів не з морської води XD (ДБН В.2.6-98:2009, таблиця 4.1, рядки XD1-XD3):",
      notes: ["Хлориди не з морської води не задані."],
      formula: "XD = не застосовується",
    };
  }

  const row = DBN_TABLE_41_ROWS[rowKey];

  return {
    key: "xd-chlorides",
    caption:
      "Визначення класу дії хлоридів не з морської води XD (ДБН В.2.6-98:2009, таблиця 4.1, рядки XD1-XD3):",
    items: formatDbnRowItems(row),
    formula: `XD = рядок таблиці 4.1: ${row.characteristic} => ${row.exposureClass}`,
  };
}

function buildXsStep(rowKey: XsExposureRow): ConcreteExposureClassReportStep {
  if (rowKey === "none") {
    return {
      key: "xs-marine-chlorides",
      caption:
        "Визначення класу дії хлоридів морського походження XS (ДСТУ ENV/EN 206, група XS; у ДБН В.2.6-98:2009 таблиці 4.3 і 4.4 класи XS враховані разом із XD):",
      notes: [
        "У наданому PDF ДБН В.2.6-98:2009 класи XS1-XS3 не наведені як рядки таблиці 4.1.",
        "Дія хлоридів морського походження не задана.",
      ],
      formula: "XS = не застосовується",
    };
  }

  return {
    key: "xs-marine-chlorides",
    caption:
      "Визначення класу дії хлоридів морського походження XS (ДСТУ ENV/EN 206, група XS; у ДБН В.2.6-98:2009 таблиці 4.3 і 4.4 класи XS враховані разом із XD):",
    items: [
      `Клас XS: ${rowKey}`,
      `Характеристика середовища: ${XS_ROW_LABELS[rowKey]}`,
    ],
    notes: [
      "У наданому PDF ДБН В.2.6-98:2009 класи XS1-XS3 не наведені як рядки таблиці 4.1.",
      "Для розрахунку захисного шару ДБН таблиці 4.3 і 4.4 враховують XD/XS спільно.",
    ],
    formula: `XS = клас хлоридів морського походження за ДСТУ ENV/EN 206 => ${rowKey}`,
  };
}

function buildXfStep(rowKey: XfExposureRow): ConcreteExposureClassReportStep {
  if (rowKey === "none") {
    return {
      key: "xf-freeze-thaw",
      caption:
        "Визначення класу поперемінного заморожування-відтавання XF (ДБН В.2.6-98:2009, таблиця 4.1, рядки XF1-XF4):",
      notes: ["Поперемінне заморожування-відтавання не задане."],
      formula: "XF = не застосовується",
    };
  }

  const row = DBN_TABLE_41_ROWS[rowKey];

  return {
    key: "xf-freeze-thaw",
    caption:
      "Визначення класу поперемінного заморожування-відтавання XF (ДБН В.2.6-98:2009, таблиця 4.1, рядки XF1-XF4):",
    items: formatDbnRowItems(row),
    formula: `XF = рядок таблиці 4.1: ${row.characteristic} => ${row.exposureClass}`,
  };
}

function buildXaStep(
  rowKey: XaExposureRow,
  hasChemicalAggressivenessConfirmation: boolean,
): ConcreteExposureClassReportStep {
  if (rowKey === "none") {
    return {
      key: "xa-chemical-attack",
      caption:
        "Визначення класу хімічних та біологічних дій XA (ДБН В.2.6-98:2009, таблиця 4.1, рядки XA1-XA3; ДСТУ Б В.2.6-145 для класифікації агресивності середовища):",
      notes: ["Хімічні та біологічні дії не задані."],
      formula: "XA = не застосовується",
    };
  }

  if (rowKey === "unknown_requires_classification") {
    return {
      key: "xa-chemical-attack",
      caption:
        "Визначення класу хімічних та біологічних дій XA (ДБН В.2.6-98:2009, таблиця 4.1, рядки XA1-XA3; ДСТУ Б В.2.6-145 для класифікації агресивності середовища):",
      notes: [XA_CLASSIFICATION_WARNING],
      formula:
        "XA = потрібна класифікація агресивності середовища за ДСТУ Б В.2.6-145",
    };
  }

  const row = DBN_TABLE_41_ROWS[rowKey];

  return {
    key: "xa-chemical-attack",
    caption:
      "Визначення класу хімічних та біологічних дій XA (ДБН В.2.6-98:2009, таблиця 4.1, рядки XA1-XA3; ДСТУ Б В.2.6-145 для класифікації агресивності середовища):",
    items: formatDbnRowItems(row),
    formula: `XA = рядок таблиці 4.1: ${row.characteristic}; підтвердження = ${formatBooleanLabel(
      hasChemicalAggressivenessConfirmation,
    )} => ${row.exposureClass}`,
  };
}

function buildClassSetStep(
  classes: ExposureClass[],
  rawParts: string[],
): ConcreteExposureClassReportStep {
  return {
    key: "class-set",
    caption:
      "Формування повного набору класів впливу середовища (ДБН В.2.6-98:2009, розділ 4.3, таблиця 4.1; ДСТУ ENV/EN 206 для XS):",
    notes: [
      "Для одного елемента може бути призначено кілька класів впливу одночасно.",
      "Класи XF та XA залишаються у повному наборі класів і формують додаткові вимоги до бетону.",
    ],
    formula: `класи впливу = union(${rawParts.join("; ")}) = [${formatClasses(
      classes,
    )}]`,
  };
}

function buildDbnMinimumConcreteStep(
  dbnMinimumConcreteClasses: DbnMinimumConcreteClass[],
): ConcreteExposureClassReportStep {
  return {
    key: "dbn-minimum-concrete",
    caption:
      "Мінімальні класи бетону за рядками таблиці 4.1 ДБН В.2.6-98:2009:",
    notes: [
      "Класи XS не наведені як окремі рядки таблиці 4.1 у наданому PDF, тому в цьому пункті не мають мінімального класу бетону за таблицею 4.1.",
    ],
    formula: `мінімальні класи бетону за таблицею 4.1 = [${dbnMinimumConcreteClasses
      .map((item) => `${item.exposureClass}: ${item.minimumConcreteClass}`)
      .join("; ")}]`,
  };
}

function buildGoverningStep(
  classes: ExposureClass[],
  governingClass: CoverExposureClass | null,
): ConcreteExposureClassReportStep {
  const candidates = classes.filter(isCoverExposureClass);

  return {
    key: "governing-cover-class",
    caption:
      "Вибір керівного класу для розрахунку захисного шару (ДБН В.2.6-98:2009, п. 4.4.2.4.1, таблиця 4.3; п. 4.4.2.4.2, таблиця 4.4):",
    notes: [
      "Для визначення мінімального захисного шару за довговічністю використовується один клас із груп X0, XC, XD або XS.",
      "Якщо для елемента одночасно призначено кілька таких класів, для калькулятора захисного шару передається найбільш несприятливий клас.",
      "Класи XF та XA не використовуються як основний exposure_class для таблиці захисного шару, але залишаються додатковими вимогами.",
    ],
    formula: `керівний клас = max([${formatClasses(
      candidates,
    )}]) = ${governingClass ?? "не визначено"}`,
  };
}

function buildAdditionalRequirementsStep(
  additionalDurabilityRequirements: string[],
): ConcreteExposureClassReportStep {
  return {
    key: "additional-requirements",
    caption:
      "Додаткові вимоги до довговічності (ДБН В.2.6-98:2009, таблиця 4.1; ДСТУ Б В.2.6-145 для XA):",
    notes: [
      "Класи XF та XA не повинні ігноруватися після вибору керівного класу для захисного шару.",
      "Вони формують додаткові вимоги до бетону, морозостійкості, водонепроникності, складу бетонної суміші або спеціального захисту конструкції.",
    ],
    formula:
      additionalDurabilityRequirements.length > 0
        ? `додаткові вимоги = f(XF; XA) = [${additionalDurabilityRequirements.join(
            "; ",
          )}]`
        : "додаткові вимоги = []",
  };
}

function buildConclusionStep(
  classes: ExposureClass[],
  governingClass: CoverExposureClass | null,
): ConcreteExposureClassReportStep {
  return {
    key: "conclusion",
    caption:
      "Висновок щодо класів впливу середовища (ДБН В.2.6-98:2009, розділ 4.3-4.4; ДСТУ ENV/EN 206 для XS):",
    notes: [
      "За результатами аналізу умов експлуатації визначено повний набір класів впливу середовища та керівний клас для подальшого розрахунку захисного шару бетону.",
    ],
    formula: `класи впливу => керівний клас = [${formatClasses(
      classes,
    )}] => ${governingClass ?? "не визначено"}`,
  };
}

function getDbnMinimumConcreteClasses(
  classes: ExposureClass[],
): DbnMinimumConcreteClass[] {
  return classes.filter(isDbnTable41ExposureClass).map((exposureClass) => ({
    exposureClass,
    minimumConcreteClass: DBN_TABLE_41_ROWS[exposureClass].minimumConcreteClass,
  }));
}

function buildAdditionalRequirements(classes: ExposureClass[]): string[] {
  const requirements: string[] = [];

  if (classes.some((cls) => cls.startsWith("XF"))) {
    addUnique(requirements, XF_REQUIREMENT);
  }
  if (classes.some((cls) => cls.startsWith("XA"))) {
    addUnique(requirements, XA_REQUIREMENT);
  }

  return requirements;
}

export function getConcreteExposureClassReport(
  input: ConcreteExposureClassInput,
): ConcreteExposureClassReport {
  const warnings: string[] = [];
  const errors: string[] = [];
  const rawParts: string[] = [input.carbonationExposureRow];
  const classes: ExposureClass[] = [];

  addUnique(classes, input.carbonationExposureRow);
  if (input.xdExposureRow !== "none") {
    addUnique(classes, input.xdExposureRow);
    rawParts.push(input.xdExposureRow);
  }
  if (input.xsExposureRow !== "none") {
    addUnique(classes, input.xsExposureRow);
    rawParts.push(input.xsExposureRow);
  }
  if (input.xfExposureRow !== "none") {
    addUnique(classes, input.xfExposureRow);
    rawParts.push(input.xfExposureRow);
  }
  if (
    input.xaExposureRow !== "none" &&
    input.xaExposureRow !== "unknown_requires_classification"
  ) {
    addUnique(classes, input.xaExposureRow);
    rawParts.push(input.xaExposureRow);
  }
  if (input.xaExposureRow === "unknown_requires_classification") {
    rawParts.push("XA потребує класифікації");
    addUnique(warnings, XA_CLASSIFICATION_WARNING);
  }
  if (
    input.xaExposureRow !== "none" &&
    input.xaExposureRow !== "unknown_requires_classification" &&
    input.hasChemicalAggressivenessConfirmation === false
  ) {
    addUnique(warnings, XA_CONFIRMATION_WARNING);
  }
  if (
    input.carbonationExposureRow === "X0" &&
    (input.xdExposureRow !== "none" ||
      input.xsExposureRow !== "none" ||
      input.xfExposureRow !== "none" ||
      input.xaExposureRow !== "none")
  ) {
    addUnique(warnings, X0_AGGRESSIVE_WARNING);
  }

  const exposureClasses = sortExposureClasses(classes);
  const governingCoverExposureClass =
    getGoverningCoverExposureClass(exposureClasses);

  if (governingCoverExposureClass === null) {
    errors.push(
      "Керівний клас для розрахунку захисного шару не визначено. Потрібно вибрати рядок X0/XC або клас XD/XS.",
    );
  }

  const dbnMinimumConcreteClasses =
    getDbnMinimumConcreteClasses(exposureClasses);
  const additionalDurabilityRequirements =
    buildAdditionalRequirements(exposureClasses);
  const steps: ConcreteExposureClassReportStep[] = [
    buildInputStep(input),
    buildX0XcStep(input.carbonationExposureRow),
    buildXdStep(input.xdExposureRow),
    buildXsStep(input.xsExposureRow),
    buildXfStep(input.xfExposureRow),
    buildXaStep(
      input.xaExposureRow,
      input.hasChemicalAggressivenessConfirmation,
    ),
    buildClassSetStep(exposureClasses, rawParts),
    buildDbnMinimumConcreteStep(dbnMinimumConcreteClasses),
    buildGoverningStep(exposureClasses, governingCoverExposureClass),
    buildAdditionalRequirementsStep(additionalDurabilityRequirements),
    buildConclusionStep(exposureClasses, governingCoverExposureClass),
  ];

  return {
    input,
    valid: errors.length === 0 && governingCoverExposureClass !== null,
    errors,
    warnings,
    values: governingCoverExposureClass
      ? {
          exposureClasses,
          governingCoverExposureClass,
          dbnMinimumConcreteClasses,
          additionalDurabilityRequirements,
        }
      : null,
    steps,
  };
}

export function getConcreteExposureClassReturnUrl({
  returnTo = "/calculator/concrete-cover-durability",
  returnField = "exposureClass",
  governingCoverExposureClass,
  exposureClasses,
}: {
  returnTo?: string;
  returnField?: string;
  governingCoverExposureClass: CoverExposureClass;
  exposureClasses: ExposureClass[];
}): string {
  const params = new URLSearchParams();
  params.set(returnField, governingCoverExposureClass);
  params.set("sourceExposureClasses", exposureClasses.join(","));
  params.set("sourceCalculator", "concrete-exposure-class");

  return `${returnTo}?${params.toString()}`;
}
