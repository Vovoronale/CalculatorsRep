export const FOUNDATION_BASE_PRESSURE_SOURCE =
  "Методика визначення крайових напружень під прямокутною підошвою фундаменту";

export type FoundationBasePressureInput = {
  verticalForceT: number;
  momentXTm: number;
  shearYT: number;
  momentYTm: number;
  shearXT: number;
  foundationLengthM: number;
  foundationWidthM: number;
  embedmentDepthM: number;
  loadApplicationHeightM: number;
  soilAndFoundationUnitWeightTM3: number;
};

export type FoundationBasePressureUplift =
  | {
      type: "none";
      contactStressesTM2: [number, number, number, number];
      upliftSharePercent: 0;
    }
  | {
      type: "one-corner";
      c1M: number;
      c2M: number;
      upliftAreaM2: number;
      contactStressesTM2: [number, number, number];
      upliftSharePercent: number;
      compressedPolygon: Point[];
    }
  | {
      type: "two-corners";
      c1M: number;
      c2M: number;
      upliftAreaM2: number;
      contactStressesTM2: [number, number];
      upliftSharePercent: number;
      compressedPolygon: Point[];
    }
  | {
      type: "generic";
      upliftAreaM2: number;
      contactStressesTM2: number[];
      upliftSharePercent: number;
      compressedPolygon: Point[];
    };

export type FoundationBasePressureValues = {
  selfWeightT: number;
  totalVerticalForceT: number;
  areaM2: number;
  meanPressureTM2: number;
  sectionModulusWyM3: number;
  sectionModulusWxM3: number;
  baseMomentXTm: number;
  baseMomentYTm: number;
  eccentricityXM: number;
  eccentricityYM: number;
  noUpliftCornerStressesTM2: [number, number, number, number];
  negativeCornerPointNumbers: CornerPointNumber[];
  resultantXM: number;
  resultantYM: number;
  uplift: FoundationBasePressureUplift;
  equilibrium?: {
    forceT: number;
    momentXTm: number;
    momentYTm: number;
  };
};

export type FoundationBasePressureReportStep = {
  key:
    | "inputs"
    | "vertical-load"
    | "geometry"
    | "average-pressure"
    | "base-loads"
    | "no-uplift-stresses"
    | "no-uplift-result"
    | "contact-model"
    | "uplift-one-corner"
    | "uplift-two-corners"
    | "uplift-generic"
    | "equilibrium";
  caption: string;
  items?: string[];
  notes?: string[];
  formula?: string;
  formulas?: string[];
};

export type FoundationBasePressureReport = {
  input: FoundationBasePressureInput;
  valid: boolean;
  errors: string[];
  warnings: string[];
  values: FoundationBasePressureValues | null;
  steps: FoundationBasePressureReportStep[];
};

type Point = [number, number];
type CornerPointNumber = 1 | 2 | 3 | 4;

type Plane = {
  p0: number;
  ax: number;
  ay: number;
};

type IntegratedPressure = {
  forceT: number;
  momentXTm: number;
  momentYTm: number;
  areaM2: number;
  polygon: Point[];
};

export const DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT: FoundationBasePressureInput = {
  verticalForceT: 26,
  momentXTm: 2,
  shearYT: 0.5,
  momentYTm: 9.7,
  shearXT: 9,
  foundationLengthM: 2.4,
  foundationWidthM: 1.8,
  embedmentDepthM: 2,
  loadApplicationHeightM: 1.6,
  soilAndFoundationUnitWeightTM3: 2,
};

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isNonNegativeFinite(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function fixed(value: number, digits: number): string {
  return value.toFixed(digits);
}

function getNegativeCornerPointNumbers(
  cornerStressesTM2: [number, number, number, number],
): CornerPointNumber[] {
  return cornerStressesTM2.flatMap((stress, index) =>
    stress < 0 ? ([(index + 1) as CornerPointNumber] as CornerPointNumber[]) : [],
  );
}

export function formatFoundationBasePressureNumber(
  value: number,
  maximumFractionDigits = 2,
): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
    minimumFractionDigits: 0,
    useGrouping: false,
  }).format(value);
}

function pressureAt(plane: Plane, point: Point): number {
  return plane.p0 + plane.ax * point[0] + plane.ay * point[1];
}

function clipPolygonByPositivePressure(polygon: Point[], plane: Plane): Point[] {
  const clipped: Point[] = [];

  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    const currentPressure = pressureAt(plane, current);
    const nextPressure = pressureAt(plane, next);
    const currentInside = currentPressure >= -1e-12;
    const nextInside = nextPressure >= -1e-12;

    if (currentInside && nextInside) {
      clipped.push(next);
      continue;
    }

    if (currentInside !== nextInside) {
      const ratio = currentPressure / (currentPressure - nextPressure);
      const intersection: Point = [
        current[0] + ratio * (next[0] - current[0]),
        current[1] + ratio * (next[1] - current[1]),
      ];
      clipped.push(intersection);

      if (!currentInside && nextInside) {
        clipped.push(next);
      }
    }
  }

  return clipped;
}

function integratePressureTriangle(
  pointA: Point,
  pointB: Point,
  pointC: Point,
  plane: Plane,
): IntegratedPressure {
  const area =
    Math.abs(
      (pointB[0] - pointA[0]) * (pointC[1] - pointA[1]) -
        (pointC[0] - pointA[0]) * (pointB[1] - pointA[1]),
    ) / 2;

  if (area < 1e-14) {
    return { forceT: 0, momentXTm: 0, momentYTm: 0, areaM2: 0, polygon: [] };
  }

  const points = [pointA, pointB, pointC];
  const pressures = points.map((point) => pressureAt(plane, point));
  const pressureSum = pressures[0] + pressures[1] + pressures[2];
  const xSum = pointA[0] + pointB[0] + pointC[0];
  const ySum = pointA[1] + pointB[1] + pointC[1];
  const xPressureSum = points.reduce(
    (sum, point, index) => sum + point[0] * pressures[index],
    0,
  );
  const yPressureSum = points.reduce(
    (sum, point, index) => sum + point[1] * pressures[index],
    0,
  );

  return {
    forceT: (area * pressureSum) / 3,
    momentYTm: (area * (xSum * pressureSum + xPressureSum)) / 12,
    momentXTm: (area * (ySum * pressureSum + yPressureSum)) / 12,
    areaM2: area,
    polygon: [],
  };
}

function integratePositivePressure(
  lengthM: number,
  widthM: number,
  plane: Plane,
): IntegratedPressure {
  const rectangle: Point[] = [
    [0, 0],
    [lengthM, 0],
    [lengthM, widthM],
    [0, widthM],
  ];
  const polygon = clipPolygonByPositivePressure(rectangle, plane);

  if (polygon.length < 3) {
    return { forceT: 0, momentXTm: 0, momentYTm: 0, areaM2: 0, polygon };
  }

  const integrated: IntegratedPressure = {
    forceT: 0,
    momentXTm: 0,
    momentYTm: 0,
    areaM2: 0,
    polygon,
  };

  for (let index = 1; index < polygon.length - 1; index += 1) {
    const triangle = integratePressureTriangle(
      polygon[0],
      polygon[index],
      polygon[index + 1],
      plane,
    );
    integrated.forceT += triangle.forceT;
    integrated.momentXTm += triangle.momentXTm;
    integrated.momentYTm += triangle.momentYTm;
    integrated.areaM2 += triangle.areaM2;
  }

  return integrated;
}

function solveLinear3(matrix: number[][], vector: number[]): [number, number, number] {
  const augmented = matrix.map((row, index) => [...row, vector[index]]);

  for (let column = 0; column < 3; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < 3; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) {
        pivot = row;
      }
    }

    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];

    const divisor = augmented[column][column];
    if (Math.abs(divisor) < 1e-12) {
      throw new Error("Unable to solve no-tension pressure plane.");
    }

    for (let item = column; item < 4; item += 1) {
      augmented[column][item] /= divisor;
    }

    for (let row = 0; row < 3; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      for (let item = column; item < 4; item += 1) {
        augmented[row][item] -= factor * augmented[column][item];
      }
    }
  }

  return [augmented[0][3], augmented[1][3], augmented[2][3]];
}

function solveNoTensionPressurePlane({
  lengthM,
  widthM,
  totalVerticalForceT,
  baseMomentXTm,
  baseMomentYTm,
  areaM2,
  sectionModulusWyM3,
  sectionModulusWxM3,
}: {
  lengthM: number;
  widthM: number;
  totalVerticalForceT: number;
  baseMomentXTm: number;
  baseMomentYTm: number;
  areaM2: number;
  sectionModulusWyM3: number;
  sectionModulusWxM3: number;
}): { plane: Plane; integrated: IntegratedPressure } {
  const targetForce = totalVerticalForceT;
  const targetMomentX = totalVerticalForceT * (widthM / 2 + baseMomentXTm / totalVerticalForceT);
  const targetMomentY = totalVerticalForceT * (lengthM / 2 + baseMomentYTm / totalVerticalForceT);
  let plane: Plane = {
    ax: (2 * (baseMomentYTm / sectionModulusWyM3)) / lengthM,
    ay: (2 * (baseMomentXTm / sectionModulusWxM3)) / widthM,
    p0: 0,
  };
  plane = {
    ...plane,
    p0:
      totalVerticalForceT / areaM2 -
      (plane.ax * lengthM) / 2 -
      (plane.ay * widthM) / 2,
  };

  const residual = (candidate: Plane): [number, number, number] => {
    const integrated = integratePositivePressure(lengthM, widthM, candidate);
    return [
      integrated.forceT - targetForce,
      integrated.momentXTm - targetMomentX,
      integrated.momentYTm - targetMomentY,
    ];
  };

  for (let iteration = 0; iteration < 50; iteration += 1) {
    const currentResidual = residual(plane);
    const residualNorm = Math.hypot(...currentResidual);

    if (residualNorm < 1e-8) break;

    const variables = [plane.p0, plane.ax, plane.ay];
    const jacobian = [[], [], []] as number[][];

    for (let column = 0; column < 3; column += 1) {
      const delta = 1e-5 * Math.max(1, Math.abs(variables[column]));
      const perturbed = [...variables];
      perturbed[column] += delta;
      const nextResidual = residual({
        p0: perturbed[0],
        ax: perturbed[1],
        ay: perturbed[2],
      });

      for (let row = 0; row < 3; row += 1) {
        jacobian[row][column] = (nextResidual[row] - currentResidual[row]) / delta;
      }
    }

    const step = solveLinear3(
      jacobian,
      currentResidual.map((value) => -value),
    );
    let damping = 1;
    let accepted = false;

    for (let lineSearch = 0; lineSearch < 20; lineSearch += 1) {
      const candidate = {
        p0: plane.p0 + damping * step[0],
        ax: plane.ax + damping * step[1],
        ay: plane.ay + damping * step[2],
      };
      const candidateIntegrated = integratePositivePressure(lengthM, widthM, candidate);
      const candidateResidual = residual(candidate);

      if (
        candidateIntegrated.areaM2 > 1e-9 &&
        Math.hypot(...candidateResidual) < residualNorm
      ) {
        plane = candidate;
        accepted = true;
        break;
      }

      damping *= 0.5;
    }

    if (!accepted) {
      plane = {
        p0: plane.p0 + 0.1 * step[0],
        ax: plane.ax + 0.1 * step[1],
        ay: plane.ay + 0.1 * step[2],
      };
    }
  }

  return {
    plane,
    integrated: integratePositivePressure(lengthM, widthM, plane),
  };
}

function getValidationErrors(input: FoundationBasePressureInput): string[] {
  const errors: string[] = [];

  if (!isPositiveFinite(input.foundationLengthM)) errors.push("l має бути більше 0.");
  if (!isPositiveFinite(input.foundationWidthM)) errors.push("b має бути більше 0.");
  if (!isNonNegativeFinite(input.embedmentDepthM)) {
    errors.push("h_gr має бути не менше 0.");
  }
  if (!isNonNegativeFinite(input.loadApplicationHeightM)) {
    errors.push("h_fund має бути не менше 0.");
  }
  if (!isNonNegativeFinite(input.soilAndFoundationUnitWeightTM3)) {
    errors.push("γ має бути не менше 0.");
  }

  const numericEntries = Object.entries(input);
  if (numericEntries.some(([, value]) => !isFiniteNumber(value))) {
    errors.push("Усі числові поля мають бути скінченними числами.");
  }

  if (
    errors.length === 0 &&
    input.verticalForceT +
      input.soilAndFoundationUnitWeightTM3 *
        input.foundationWidthM *
        input.foundationLengthM *
        input.embedmentDepthM <
      0
  ) {
    errors.push("N_total має бути не менше 0.");
  }

  return errors;
}

function buildInputStep(input: FoundationBasePressureInput): FoundationBasePressureReportStep {
  return {
    key: "inputs",
    caption: "Вихідні дані:",
    items: [
      `Mx = ${fixed(input.momentXTm, 2)} т·м`,
      `My = ${fixed(input.momentYTm, 2)} т·м`,
      `Qx = ${fixed(input.shearXT, 3)} т`,
      `Qy = ${fixed(input.shearYT, 3)} т`,
      `N = ${fixed(input.verticalForceT, 2)} т`,
      `l = ${fixed(input.foundationLengthM, 2)} м`,
      `b = ${fixed(input.foundationWidthM, 2)} м`,
      `γ = ${fixed(input.soilAndFoundationUnitWeightTM3, 2)} т/м³`,
      `h_gr = ${fixed(input.embedmentDepthM, 2)} м`,
      `h_fund = ${fixed(input.loadApplicationHeightM, 2)} м`,
    ],
  };
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function floorTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.floor((value + Number.EPSILON) * factor) / factor;
}

function classifyUplift({
  input,
  plane,
  integrated,
}: {
  input: FoundationBasePressureInput;
  plane: Plane;
  integrated: IntegratedPressure;
}): FoundationBasePressureUplift {
  const { foundationLengthM: lengthM, foundationWidthM: widthM } = input;
  const cornerPressures = [
    Math.max(0, pressureAt(plane, [lengthM, widthM])),
    Math.max(0, pressureAt(plane, [lengthM, 0])),
    Math.max(0, pressureAt(plane, [0, widthM])),
    Math.max(0, pressureAt(plane, [0, 0])),
  ];
  const upliftSharePercent = ((lengthM * widthM - integrated.areaM2) / (lengthM * widthM)) * 100;
  const polygon = integrated.polygon;
  const bottomIntercept = polygon.find(
    ([x, y]) => x > 1e-8 && x < lengthM - 1e-8 && Math.abs(y) < 1e-8,
  );
  const topIntercept = polygon.find(
    ([x, y]) => x > 1e-8 && x < lengthM - 1e-8 && Math.abs(y - widthM) < 1e-8,
  );
  const leftIntercept = polygon.find(
    ([x, y]) => Math.abs(x) < 1e-8 && y > 1e-8 && y < widthM - 1e-8,
  );

  if (bottomIntercept && topIntercept) {
    const c1M = floorTo(topIntercept[0], 4);
    const c2M = roundTo(bottomIntercept[0], 4);
    const upliftAreaM2 = roundTo(((c1M + c2M) / 2) * widthM, 4);

    return {
      type: "two-corners",
      c1M,
      c2M,
      upliftAreaM2,
      contactStressesTM2: [
        roundTo(cornerPressures[0], 2),
        roundTo(cornerPressures[1], 2),
      ],
      upliftSharePercent: roundTo(((c1M + c2M) / 2 / lengthM) * 100, 1),
      compressedPolygon: polygon,
    };
  }

  if (bottomIntercept && leftIntercept) {
    const c1M = roundTo(leftIntercept[1], 4);
    const c2M = roundTo(bottomIntercept[0], 4);
    const upliftAreaM2 = roundTo((c1M * c2M) / 2, 4);

    return {
      type: "one-corner",
      c1M,
      c2M,
      upliftAreaM2,
      contactStressesTM2: [
        roundTo(cornerPressures[0], 2),
        roundTo(cornerPressures[1], 2),
        roundTo(cornerPressures[2], 2),
      ],
      upliftSharePercent: roundTo((c1M * c2M) / (2 * widthM * lengthM) * 100, 1),
      compressedPolygon: polygon,
    };
  }

  return {
    type: "generic",
    upliftAreaM2: roundTo(lengthM * widthM - integrated.areaM2, 4),
    contactStressesTM2: cornerPressures.filter((value) => value > 1e-8),
    upliftSharePercent: roundTo(upliftSharePercent, 1),
    compressedPolygon: polygon,
  };
}

export function getFoundationBasePressureReport(
  input: FoundationBasePressureInput,
): FoundationBasePressureReport {
  const inputStep = buildInputStep(input);
  const errors = getValidationErrors(input);

  if (errors.length > 0) {
    return {
      input,
      valid: false,
      errors,
      warnings: [],
      values: null,
      steps: [inputStep],
    };
  }

  const selfWeightT =
    input.soilAndFoundationUnitWeightTM3 *
    input.foundationWidthM *
    input.foundationLengthM *
    input.embedmentDepthM;
  const totalVerticalForceT = input.verticalForceT + selfWeightT;
  const areaM2 = input.foundationWidthM * input.foundationLengthM;
  const meanPressureTM2 = totalVerticalForceT / areaM2;
  const sectionModulusWyM3 = (input.foundationWidthM * input.foundationLengthM ** 2) / 6;
  const sectionModulusWxM3 = (input.foundationLengthM * input.foundationWidthM ** 2) / 6;
  const baseMomentXTm = Math.abs(
    input.momentXTm + input.shearYT * input.loadApplicationHeightM,
  );
  const baseMomentYTm = Math.abs(
    input.momentYTm + input.shearXT * input.loadApplicationHeightM,
  );
  const eccentricityXM = baseMomentYTm / totalVerticalForceT;
  const eccentricityYM = baseMomentXTm / totalVerticalForceT;
  const noUpliftCornerStressesTM2: [number, number, number, number] = [
    totalVerticalForceT / areaM2 + baseMomentYTm / sectionModulusWyM3 + baseMomentXTm / sectionModulusWxM3,
    totalVerticalForceT / areaM2 + baseMomentYTm / sectionModulusWyM3 - baseMomentXTm / sectionModulusWxM3,
    totalVerticalForceT / areaM2 - baseMomentYTm / sectionModulusWyM3 + baseMomentXTm / sectionModulusWxM3,
    totalVerticalForceT / areaM2 - baseMomentYTm / sectionModulusWyM3 - baseMomentXTm / sectionModulusWxM3,
  ];
  const negativeCornerPointNumbers = getNegativeCornerPointNumbers(
    noUpliftCornerStressesTM2,
  );
  const resultantXM = input.foundationLengthM / 2 + eccentricityXM;
  const resultantYM = input.foundationWidthM / 2 + eccentricityYM;
  const hasUplift = negativeCornerPointNumbers.length > 0;
  let uplift: FoundationBasePressureUplift = {
    type: "none",
    contactStressesTM2: noUpliftCornerStressesTM2,
    upliftSharePercent: 0,
  };
  let equilibrium: FoundationBasePressureValues["equilibrium"];

  if (hasUplift) {
    const noTensionSolution = solveNoTensionPressurePlane({
      lengthM: input.foundationLengthM,
      widthM: input.foundationWidthM,
      totalVerticalForceT,
      baseMomentXTm,
      baseMomentYTm,
      areaM2,
      sectionModulusWyM3,
      sectionModulusWxM3,
    });
    uplift = classifyUplift({
      input,
      plane: noTensionSolution.plane,
      integrated: noTensionSolution.integrated,
    });
    equilibrium = {
      forceT: noTensionSolution.integrated.forceT,
      momentXTm: noTensionSolution.integrated.momentXTm - totalVerticalForceT * input.foundationWidthM / 2,
      momentYTm: noTensionSolution.integrated.momentYTm - totalVerticalForceT * input.foundationLengthM / 2,
    };
  }

  const values: FoundationBasePressureValues = {
    selfWeightT,
    totalVerticalForceT,
    areaM2,
    meanPressureTM2,
    sectionModulusWyM3,
    sectionModulusWxM3,
    baseMomentXTm,
    baseMomentYTm,
    eccentricityXM,
    eccentricityYM,
    noUpliftCornerStressesTM2,
    negativeCornerPointNumbers,
    resultantXM,
    resultantYM,
    uplift,
    equilibrium,
  };
  const warnings = hasUplift
    ? ["Найменше з обчислених напружень менше нуля, тому маємо відрив підошви."]
    : [];
  const steps = buildReportSteps(input, values);

  return {
    input,
    valid: true,
    errors,
    warnings,
    values,
    steps,
  };
}

function formatCornerPointList(points: CornerPointNumber[]): string {
  if (points.length <= 1) return String(points[0] ?? "");
  if (points.length === 2) return `${points[0]} і ${points[1]}`;

  return `${points.slice(0, -1).join(", ")} і ${points[points.length - 1]}`;
}

function formatNegativeCornerStressList(
  values: FoundationBasePressureValues,
): string {
  return values.negativeCornerPointNumbers
    .map((point) => {
      const stress = values.noUpliftCornerStressesTM2[point - 1];

      return `σ${point} = ${fixed(stress, 2)} т/м²`;
    })
    .join(", ");
}

function getUpliftSchemeName(
  uplift: FoundationBasePressureUplift,
): string {
  if (uplift.type === "one-corner") return "трикутник";
  if (uplift.type === "two-corners") return "трапеція";
  if (uplift.type === "none") return "відрив відсутній";

  return "складна форма";
}

function getContactPointNumbers(
  uplift: FoundationBasePressureUplift,
): CornerPointNumber[] {
  if (uplift.type === "none") return [1, 2, 3, 4];
  if (uplift.type === "one-corner") return [1, 2, 3];
  if (uplift.type === "two-corners") return [1, 2];

  return [];
}

function buildReportSteps(
  input: FoundationBasePressureInput,
  values: FoundationBasePressureValues,
): FoundationBasePressureReportStep[] {
  const steps: FoundationBasePressureReportStep[] = [
    buildInputStep(input),
    {
      key: "vertical-load",
      caption: `Розрахунок вертикального навантаження з урахуванням власної ваги фундаменту і ґрунту на обрізах (${FOUNDATION_BASE_PRESSURE_SOURCE}):`,
      formulas: [
        `G_fund = γ * b * l * h_gr = ${fixed(input.soilAndFoundationUnitWeightTM3, 2)} * ${fixed(input.foundationWidthM, 2)} * ${fixed(input.foundationLengthM, 2)} * ${fixed(input.embedmentDepthM, 2)} = ${fixed(values.selfWeightT, 2)} т`,
        `N_total = N + G_fund = ${fixed(input.verticalForceT, 2)} + ${fixed(values.selfWeightT, 2)} = ${fixed(values.totalVerticalForceT, 2)} т >= 0`,
      ],
    },
    {
      key: "geometry",
      caption: `Геометричні характеристики підошви (${FOUNDATION_BASE_PRESSURE_SOURCE}):`,
      formulas: [
        `A = b * l = ${fixed(input.foundationWidthM, 2)} * ${fixed(input.foundationLengthM, 2)} = ${fixed(values.areaM2, 3)} м²`,
        `Wy = b * l^2 / 6 = ${fixed(input.foundationWidthM, 2)} * ${fixed(input.foundationLengthM, 2)}^2 / 6 = ${fixed(values.sectionModulusWyM3, 3)} м³`,
        `Wx = l * b^2 / 6 = ${fixed(input.foundationLengthM, 2)} * ${fixed(input.foundationWidthM, 2)}^2 / 6 = ${fixed(values.sectionModulusWxM3, 3)} м³`,
      ],
    },
    {
      key: "average-pressure",
      caption: `Середній тиск під підошвою (${FOUNDATION_BASE_PRESSURE_SOURCE}):`,
      formulas: [
        `p_avg = N_total / A = ${fixed(values.totalVerticalForceT, 2)} / ${fixed(values.areaM2, 3)} = ${fixed(values.meanPressureTM2, 2)} т/м²`,
      ],
    },
    {
      key: "base-loads",
      caption: `Зовнішні зусилля на рівні підошви (${FOUNDATION_BASE_PRESSURE_SOURCE}):`,
      formulas: [
        `Mx_base = |Mx + Qy * h_fund| = |${fixed(input.momentXTm, 2)} + ${fixed(input.shearYT, 3)} * ${fixed(input.loadApplicationHeightM, 2)}| = ${fixed(values.baseMomentXTm, 2)} т·м`,
        `My_base = |My + Qx * h_fund| = |${fixed(input.momentYTm, 2)} + ${fixed(input.shearXT, 3)} * ${fixed(input.loadApplicationHeightM, 2)}| = ${fixed(values.baseMomentYTm, 2)} т·м`,
        `ex = My_base / N_total = ${fixed(values.baseMomentYTm, 2)} / ${fixed(values.totalVerticalForceT, 2)} = ${fixed(values.eccentricityXM, 4)} м < l / 2 = ${fixed(input.foundationLengthM, 2)} / 2 = ${fixed(input.foundationLengthM / 2, 3)} м`,
        `ey = Mx_base / N_total = ${fixed(values.baseMomentXTm, 2)} / ${fixed(values.totalVerticalForceT, 2)} = ${fixed(values.eccentricityYM, 4)} м < b / 2 = ${fixed(input.foundationWidthM, 2)} / 2 = ${fixed(input.foundationWidthM / 2, 3)} м`,
      ],
    },
    {
      key: "no-uplift-stresses",
      caption: `Напруження по кутах підошви, обчислені без урахування відриву (${FOUNDATION_BASE_PRESSURE_SOURCE}):`,
      formulas: [
        `σ1 = N_total / A + My_base / Wy + Mx_base / Wx = ${fixed(values.totalVerticalForceT, 2)} / ${fixed(values.areaM2, 3)} + ${fixed(values.baseMomentYTm, 2)} / ${fixed(values.sectionModulusWyM3, 3)} + ${fixed(values.baseMomentXTm, 2)} / ${fixed(values.sectionModulusWxM3, 3)} = ${fixed(values.noUpliftCornerStressesTM2[0], 2)} т/м²`,
        `σ2 = N_total / A + My_base / Wy - Mx_base / Wx = ${fixed(values.totalVerticalForceT, 2)} / ${fixed(values.areaM2, 3)} + ${fixed(values.baseMomentYTm, 2)} / ${fixed(values.sectionModulusWyM3, 3)} - ${fixed(values.baseMomentXTm, 2)} / ${fixed(values.sectionModulusWxM3, 3)} = ${fixed(values.noUpliftCornerStressesTM2[1], 2)} т/м²`,
        `σ3 = N_total / A - My_base / Wy + Mx_base / Wx = ${fixed(values.totalVerticalForceT, 2)} / ${fixed(values.areaM2, 3)} - ${fixed(values.baseMomentYTm, 2)} / ${fixed(values.sectionModulusWyM3, 3)} + ${fixed(values.baseMomentXTm, 2)} / ${fixed(values.sectionModulusWxM3, 3)} = ${fixed(values.noUpliftCornerStressesTM2[2], 2)} т/м²`,
        `σ4 = N_total / A - My_base / Wy - Mx_base / Wx = ${fixed(values.totalVerticalForceT, 2)} / ${fixed(values.areaM2, 3)} - ${fixed(values.baseMomentYTm, 2)} / ${fixed(values.sectionModulusWyM3, 3)} - ${fixed(values.baseMomentXTm, 2)} / ${fixed(values.sectionModulusWxM3, 3)} = ${fixed(values.noUpliftCornerStressesTM2[3], 2)} т/м²`,
      ],
    },
  ];

  if (values.uplift.type === "none") {
    steps.push({
      key: "no-uplift-result",
      caption: "Відрив підошви відсутній:",
      items: ["Усі напруження по кутах підошви не менші нуля."],
    });
    return steps;
  }

  const negativeCornerNoun =
    values.negativeCornerPointNumbers.length === 1
      ? "від'ємного кута"
      : "від'ємних кутів";

  steps.push({
    key: "contact-model",
    caption: `Вибір схеми відриву підошви (${FOUNDATION_BASE_PRESSURE_SOURCE}):`,
    notes: [
      "Найменше з обчислених напружень менше нуля, тому маємо відрив підошви.",
      `Визначаємо від'ємні кутові напруження: ${formatNegativeCornerStressList(
        values,
      )}.`,
      `За розташуванням ${negativeCornerNoun} вибираємо схему відриву: ${getUpliftSchemeName(
        values.uplift,
      )}.`,
    ],
  });

  if (values.uplift.type === "one-corner") {
    const contactPointList = formatCornerPointList(
      getContactPointNumbers(values.uplift),
    );
    const eta1 =
      input.foundationLengthM / values.uplift.c2M +
      input.foundationWidthM / values.uplift.c1M -
      1;
    const eta2 = input.foundationLengthM / values.uplift.c2M - 1;
    const eta3 = input.foundationWidthM / values.uplift.c1M - 1;
    const unitDiagramVolumeM2 =
      input.foundationWidthM *
        input.foundationLengthM *
        (input.foundationLengthM / (2 * values.uplift.c2M) +
          input.foundationWidthM / (2 * values.uplift.c1M) -
          1) +
      (values.uplift.c1M * values.uplift.c2M) / 6;
    const pressureScaleTM2 =
      values.totalVerticalForceT / unitDiagramVolumeM2;

    steps.push({
      key: "uplift-one-corner",
      caption: `Відрив підошви в одному куті (${FOUNDATION_BASE_PRESSURE_SOURCE}):`,
      notes: [
        "Від'ємне напруження отримане в одному куті, тому зона відриву має форму трикутника.",
        "Лінія σ = 0 перетинає дві суміжні грані підошви: c1 — сторона трикутної зони відриву вздовж b, c2 — сторона трикутної зони відриву вздовж l.",
        `Після виключення зони відриву контакт зберігається в точках ${contactPointList}.`,
      ],
      formulas: [
        `c1 = y_left = ${fixed(values.uplift.c1M, 4)} м`,
        `c2 = x_bottom = ${fixed(values.uplift.c2M, 4)} м`,
        `A_lift = c1 * c2 / 2 = ${fixed(values.uplift.c1M, 4)} * ${fixed(values.uplift.c2M, 4)} / 2 = ${fixed(values.uplift.upliftAreaM2, 4)} м²`,
        `P_lift = A_lift / A * 100 = ${fixed(values.uplift.upliftAreaM2, 4)} / ${fixed(values.areaM2, 3)} * 100 = ${fixed(values.uplift.upliftSharePercent, 1)}%`,
        `η1 = l / c2 + b / c1 - 1 = ${fixed(input.foundationLengthM, 2)} / ${fixed(values.uplift.c2M, 4)} + ${fixed(input.foundationWidthM, 2)} / ${fixed(values.uplift.c1M, 4)} - 1 = ${fixed(eta1, 4)}`,
        `η2 = l / c2 - 1 = ${fixed(input.foundationLengthM, 2)} / ${fixed(values.uplift.c2M, 4)} - 1 = ${fixed(eta2, 4)}`,
        `η3 = b / c1 - 1 = ${fixed(input.foundationWidthM, 2)} / ${fixed(values.uplift.c1M, 4)} - 1 = ${fixed(eta3, 4)}`,
        `V_eta = b * l * (l / (2 * c2) + b / (2 * c1) - 1) + c1 * c2 / 6 = ${fixed(input.foundationWidthM, 2)} * ${fixed(input.foundationLengthM, 2)} * (${fixed(input.foundationLengthM, 2)} / (2 * ${fixed(values.uplift.c2M, 4)}) + ${fixed(input.foundationWidthM, 2)} / (2 * ${fixed(values.uplift.c1M, 4)}) - 1) + ${fixed(values.uplift.c1M, 4)} * ${fixed(values.uplift.c2M, 4)} / 6 = ${fixed(unitDiagramVolumeM2, 4)} м²`,
        `k = N_total / V_eta = ${fixed(values.totalVerticalForceT, 2)} / ${fixed(unitDiagramVolumeM2, 4)} = ${fixed(pressureScaleTM2, 4)} т/м²`,
        `σ1 = k * η1 = ${fixed(pressureScaleTM2, 4)} * ${fixed(eta1, 4)} = ${fixed(values.uplift.contactStressesTM2[0], 2)} т/м²`,
        `σ2 = k * η2 = ${fixed(pressureScaleTM2, 4)} * ${fixed(eta2, 4)} = ${fixed(values.uplift.contactStressesTM2[1], 2)} т/м²`,
        `σ3 = k * η3 = ${fixed(pressureScaleTM2, 4)} * ${fixed(eta3, 4)} = ${fixed(values.uplift.contactStressesTM2[2], 2)} т/м²`,
      ],
    });
  } else if (values.uplift.type === "two-corners") {
    const contactPointList = formatCornerPointList(
      getContactPointNumbers(values.uplift),
    );
    const d1M = input.foundationLengthM - values.uplift.c1M;
    const d2M = input.foundationLengthM - values.uplift.c2M;
    const pressureSlopeTM3 =
      (6 * values.totalVerticalForceT) /
      (input.foundationWidthM * (d1M ** 2 + d1M * d2M + d2M ** 2));

    steps.push({
      key: "uplift-two-corners",
      caption: `Відрив підошви у двох кутах (${FOUNDATION_BASE_PRESSURE_SOURCE}):`,
      notes: [
        "Від'ємні напруження отримані у двох суміжних кутах однієї грані, тому зона відриву має форму трапеції.",
        "Лінія σ = 0 перетинає дві протилежні грані підошви: c1 — відстань від точки 3 до перетину на верхній грані, c2 — відстань від точки 4 до перетину на нижній грані.",
        `Після виключення зони відриву контакт зберігається в точках ${contactPointList}.`,
      ],
      formulas: [
        `c1 = x_top = ${fixed(values.uplift.c1M, 4)} м`,
        `c2 = x_bottom = ${fixed(values.uplift.c2M, 4)} м`,
        `A_lift = (c1 + c2) / 2 * b = (${fixed(values.uplift.c1M, 4)} + ${fixed(values.uplift.c2M, 4)}) / 2 * ${fixed(input.foundationWidthM, 2)} = ${fixed(values.uplift.upliftAreaM2, 4)} м²`,
        `P_lift = A_lift / A * 100 = ${fixed(values.uplift.upliftAreaM2, 4)} / ${fixed(values.areaM2, 3)} * 100 = ${fixed(values.uplift.upliftSharePercent, 1)}%`,
        `d1 = l - c1 = ${fixed(input.foundationLengthM, 2)} - ${fixed(values.uplift.c1M, 4)} = ${fixed(d1M, 4)} м`,
        `d2 = l - c2 = ${fixed(input.foundationLengthM, 2)} - ${fixed(values.uplift.c2M, 4)} = ${fixed(d2M, 4)} м`,
        `k = 6 * N_total / (b * (d1^2 + d1 * d2 + d2^2)) = 6 * ${fixed(values.totalVerticalForceT, 2)} / (${fixed(input.foundationWidthM, 2)} * (${fixed(d1M, 4)}^2 + ${fixed(d1M, 4)} * ${fixed(d2M, 4)} + ${fixed(d2M, 4)}^2)) = ${fixed(pressureSlopeTM3, 4)} т/м³`,
        `σ1 = k * d1 = ${fixed(pressureSlopeTM3, 4)} * ${fixed(d1M, 4)} = ${fixed(values.uplift.contactStressesTM2[0], 2)} т/м²`,
        `σ2 = k * d2 = ${fixed(pressureSlopeTM3, 4)} * ${fixed(d2M, 4)} = ${fixed(values.uplift.contactStressesTM2[1], 2)} т/м²`,
      ],
    });
  } else {
    steps.push({
      key: "uplift-generic",
      caption: `Відрив підошви складної форми (${FOUNDATION_BASE_PRESSURE_SOURCE}):`,
      notes: [
        "Положення лінії σ = 0 утворює контактний полігон, який не зводиться до погоджених схем одного або двох кутів.",
      ],
      formulas: [
        `A_lift = ${fixed(values.uplift.upliftAreaM2, 4)} м²`,
        `P_lift = A_lift / A * 100 = ${fixed(values.uplift.upliftAreaM2, 4)} / ${fixed(values.areaM2, 3)} * 100 = ${fixed(values.uplift.upliftSharePercent, 1)}%`,
      ],
    });
  }

  if (values.equilibrium) {
    steps.push({
      key: "equilibrium",
      caption: `Перевірка рівноваги контактної епюри з урахуванням відриву (${FOUNDATION_BASE_PRESSURE_SOURCE}):`,
      formulas: [
        `ΣP = N_total = ${fixed(values.totalVerticalForceT, 2)} т`,
        `ΣMx = N_total * (y_R - b / 2) = ${fixed(values.totalVerticalForceT, 2)} * (${fixed(values.resultantYM, 4)} - ${fixed(input.foundationWidthM / 2, 4)}) = ${fixed(values.equilibrium.momentXTm, 2)} т·м ≈ Mx_base = ${fixed(values.baseMomentXTm, 2)} т·м`,
        `ΣMy = N_total * (x_R - l / 2) = ${fixed(values.totalVerticalForceT, 2)} * (${fixed(values.resultantXM, 4)} - ${fixed(input.foundationLengthM / 2, 4)}) = ${fixed(values.equilibrium.momentYTm, 2)} т·м ≈ My_base = ${fixed(values.baseMomentYTm, 2)} т·м`,
      ],
    });
  }

  return steps;
}
