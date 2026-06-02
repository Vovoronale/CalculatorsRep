export const CASSOON_LOAD_DISTRIBUTION_NOTATION = {
  shortSpan: "lk",
  longSpan: "ld",
  totalLoad: "q",
  shortDirectionCoefficient: "c1",
  longDirectionCoefficient: "c2",
  shortDirectionLoad: "qk",
  longDirectionLoad: "qd",
  spanRatio: "ld/lk",
} as const;

export const CASSOON_LOAD_DISTRIBUTION_SOURCE = {
  label:
    "Линович Л.Е. Расчет и конструирование частей гражданских зданий. Изд. 8-е, перераб. и доп. К.: Будівельник, 1972. 664 с.",
  url: "https://koha.tntu.edu.ua/bib/134803",
} as const;

export type CassoonLoadDistributionInput = {
  shortSpanM: number;
  longSpanM: number;
  totalLoadKnM2: number;
};

export type CassoonLoadDistributionValues = {
  spanRatio: number;
  elasticC1: number;
  elasticC2: number;
  c1: number;
  c2: number;
  shortDirectionLoadKnM2: number;
  longDirectionLoadKnM2: number;
  elasticShortDirectionLoadKnM2: number;
  elasticLongDirectionLoadKnM2: number;
  isOneWay: boolean;
};

export type CassoonLoadDistributionReportStep = {
  key:
    | "source"
    | "inputs"
    | "span-ratio"
    | "coefficients"
    | "one-way-rule"
    | "loads"
    | "check-sum";
  caption: string;
  formula?: string;
  items?: string[];
};

export type CassoonLoadDistributionReport = {
  input: CassoonLoadDistributionInput;
  valid: boolean;
  errors: string[];
  warnings: string[];
  values: CassoonLoadDistributionValues | null;
  steps: CassoonLoadDistributionReportStep[];
};

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function formatCassoonLoadDistributionNumber(
  value: number,
  maximumFractionDigits = 3,
): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
    minimumFractionDigits: 0,
    useGrouping: false,
  }).format(value);
}

export function getCassoonLoadDistributionCoefficients(
  shortSpanM: number,
  longSpanM: number,
): { c1: number; c2: number } {
  const shortSpanPower = shortSpanM ** 4;
  const longSpanPower = longSpanM ** 4;
  const denominator = shortSpanPower + longSpanPower;

  return {
    c1: longSpanPower / denominator,
    c2: shortSpanPower / denominator,
  };
}

function getValidationErrors(input: CassoonLoadDistributionInput): string[] {
  const errors: string[] = [];

  if (!isPositiveFinite(input.shortSpanM)) {
    errors.push("lk має бути більше 0.");
  }

  if (!isPositiveFinite(input.longSpanM)) {
    errors.push("ld має бути більше 0.");
  }

  if (!isPositiveFinite(input.totalLoadKnM2)) {
    errors.push("q має бути більше 0.");
  }

  if (
    isPositiveFinite(input.shortSpanM) &&
    isPositiveFinite(input.longSpanM) &&
    input.longSpanM < input.shortSpanM
  ) {
    errors.push("ld має бути не менше lk.");
  }

  return errors;
}

function getInputItems(input: CassoonLoadDistributionInput): string[] {
  return [
    `lk = ${formatCassoonLoadDistributionNumber(input.shortSpanM)} м`,
    `ld = ${formatCassoonLoadDistributionNumber(input.longSpanM)} м`,
    `q = ${formatCassoonLoadDistributionNumber(input.totalLoadKnM2)} кН/м²`,
  ];
}

export function getCassoonLoadDistributionReport(
  input: CassoonLoadDistributionInput,
): CassoonLoadDistributionReport {
  const errors = getValidationErrors(input);
  const baseSteps: CassoonLoadDistributionReportStep[] = [
    {
      key: "source",
      caption: `Методика розподілу навантаження між напрямами lk і ld для кесонних перекриттів за джерелом: ${CASSOON_LOAD_DISTRIBUTION_SOURCE.label}`,
      items: [
        "У книзі «Расчет и конструирование частей гражданских зданий» навантаження q розкладається між двома взаємно перпендикулярними напрямами пропорційно четвертим степеням протилежних прольотів.",
        "Для співвідношення ld/lk до 2 плита працює у двох напрямах; коли ld/lk більше 2, її зазвичай розглядають як балкову плиту з передачею навантаження в короткому напрямі.",
      ],
    },
    {
      key: "inputs",
      caption: "Вихідні дані, задані користувачем:",
      items: getInputItems(input),
    },
  ];

  if (errors.length > 0) {
    return {
      input,
      valid: false,
      errors,
      warnings: [],
      values: null,
      steps: baseSteps,
    };
  }

  const spanRatio = input.longSpanM / input.shortSpanM;
  const { c1: elasticC1, c2: elasticC2 } =
    getCassoonLoadDistributionCoefficients(input.shortSpanM, input.longSpanM);
  const isOneWay = spanRatio > 2;
  const c1 = isOneWay ? 1 : elasticC1;
  const c2 = isOneWay ? 0 : elasticC2;
  const elasticShortDirectionLoadKnM2 = elasticC1 * input.totalLoadKnM2;
  const elasticLongDirectionLoadKnM2 = elasticC2 * input.totalLoadKnM2;
  const shortDirectionLoadKnM2 = c1 * input.totalLoadKnM2;
  const longDirectionLoadKnM2 = c2 * input.totalLoadKnM2;
  const values: CassoonLoadDistributionValues = {
    spanRatio,
    elasticC1,
    elasticC2,
    c1,
    c2,
    shortDirectionLoadKnM2,
    longDirectionLoadKnM2,
    elasticShortDirectionLoadKnM2,
    elasticLongDirectionLoadKnM2,
    isOneWay,
  };
  const warnings = isOneWay
    ? [
        "ld/lk більше 2: за приміткою Ліновіча плиту доцільно розглядати як балкову, з передачею навантаження тільки за коротким прольотом lk.",
      ]
    : [];

  const steps: CassoonLoadDistributionReportStep[] = [
    ...baseSteps,
    {
      key: "span-ratio",
      caption:
        "Визначення відношення сторін для вибору розрахункової схеми (Ліновіч, розділ про кесонні перекриття, рис. VII.40):",
      formula: `ld/lk = ${formatCassoonLoadDistributionNumber(
        input.longSpanM,
      )} / ${formatCassoonLoadDistributionNumber(
        input.shortSpanM,
      )} = ${formatCassoonLoadDistributionNumber(spanRatio, 3)}`,
    },
    {
      key: "coefficients",
      caption:
        "Визначення коефіцієнтів пропорційності c1 і c2 за четвертими степенями прольотів (Ліновіч, формули розподілу qk і qd):",
      formula: `c1 = ld^4 / (lk^4 + ld^4) = ${formatCassoonLoadDistributionNumber(
        input.longSpanM,
      )}^4 / (${formatCassoonLoadDistributionNumber(
        input.shortSpanM,
      )}^4 + ${formatCassoonLoadDistributionNumber(
        input.longSpanM,
      )}^4) = ${formatCassoonLoadDistributionNumber(
        elasticC1,
        4,
      )}; c2 = lk^4 / (lk^4 + ld^4) = ${formatCassoonLoadDistributionNumber(
        input.shortSpanM,
      )}^4 / (${formatCassoonLoadDistributionNumber(
        input.shortSpanM,
      )}^4 + ${formatCassoonLoadDistributionNumber(
        input.longSpanM,
      )}^4) = ${formatCassoonLoadDistributionNumber(elasticC2, 4)}`,
    },
  ];

  if (isOneWay) {
    steps.push({
      key: "one-way-rule",
      caption:
        "Уточнення розрахункової схеми при ld/lk > 2 за приміткою Ліновіча до рис. VII.40:",
      formula: `ld/lk = ${formatCassoonLoadDistributionNumber(
        spanRatio,
        3,
      )} > 2, тому приймаємо c1 = 1; c2 = 0`,
    });
  }

  steps.push(
    {
      key: "loads",
      caption:
        "Розподіл повного навантаження q за напрямами lk і ld (Ліновіч, формули qk = c1*q; qd = c2*q):",
      formula: `qk = c1 * q = ${formatCassoonLoadDistributionNumber(
        c1,
        4,
      )} * ${formatCassoonLoadDistributionNumber(
        input.totalLoadKnM2,
      )} = ${formatCassoonLoadDistributionNumber(
        shortDirectionLoadKnM2,
        2,
      )} кН/м²; qd = c2 * q = ${formatCassoonLoadDistributionNumber(
        c2,
        4,
      )} * ${formatCassoonLoadDistributionNumber(
        input.totalLoadKnM2,
      )} = ${formatCassoonLoadDistributionNumber(
        longDirectionLoadKnM2,
        2,
      )} кН/м²`,
    },
    {
      key: "check-sum",
      caption: "Контроль суми розподілених навантажень:",
      formula: `qk + qd = ${formatCassoonLoadDistributionNumber(
        shortDirectionLoadKnM2,
        2,
      )} + ${formatCassoonLoadDistributionNumber(
        longDirectionLoadKnM2,
        2,
      )} = ${formatCassoonLoadDistributionNumber(
        shortDirectionLoadKnM2 + longDirectionLoadKnM2,
        2,
      )} кН/м²`,
    },
  );

  return {
    input,
    valid: true,
    errors,
    warnings,
    values,
    steps,
  };
}
