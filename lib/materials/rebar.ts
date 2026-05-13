export type RebarMaterial = {
  diameterMm: number;
  areaMm2: number;
};

export type RebarClassName =
  | "A240C"
  | "A400C"
  | "A500C"
  | "A600"
  | "A600C"
  | "A600K"
  | "A800"
  | "A800K"
  | "A800CK"
  | "A1000";

export type RebarClassCharacteristics = {
  className: RebarClassName;
  sourceStandard: string;
  electroHeatingTemperatureC: number | null;
  yieldStrengthMPa: number;
  tensileStrengthMPa: number;
  elongationAfterRupturePercent: number;
  uniformElongationPercent: number | null;
  totalElongationAtMaximumLoadPercent: number | null;
  bendAngleDegrees: number;
  mandrelDiameterFactor: number;
  elasticModulusGPa: number;
};

export type RebarDesignFactors = {
  gammaS?: number;
};

export type RebarDesignValues = {
  fydMPa: number;
};

export const REBAR_DIAMETERS = [
  4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 32, 36, 40,
] as const;

export const REBAR_SPACINGS = [50, 75, 100, 125, 150, 175, 200, 250, 300] as const;

export const DEFAULT_REBAR_DESIGN_FACTORS = {
  gammaS: 1.15,
} as const;

const REBAR_CLASS_CHARACTERISTICS = [
  {
    className: "A240C",
    sourceStandard: "ДСТУ 3760:2006, табл. 5",
    electroHeatingTemperatureC: null,
    yieldStrengthMPa: 240,
    tensileStrengthMPa: 370,
    elongationAfterRupturePercent: 25,
    uniformElongationPercent: null,
    totalElongationAtMaximumLoadPercent: null,
    bendAngleDegrees: 180,
    mandrelDiameterFactor: 0.5,
    elasticModulusGPa: 190,
  },
  {
    className: "A400C",
    sourceStandard: "ДСТУ 3760:2006, табл. 5",
    electroHeatingTemperatureC: null,
    yieldStrengthMPa: 400,
    tensileStrengthMPa: 500,
    elongationAfterRupturePercent: 16,
    uniformElongationPercent: null,
    totalElongationAtMaximumLoadPercent: 5,
    bendAngleDegrees: 90,
    mandrelDiameterFactor: 3,
    elasticModulusGPa: 200,
  },
  {
    className: "A500C",
    sourceStandard: "ДСТУ 3760:2006, табл. 5",
    electroHeatingTemperatureC: null,
    yieldStrengthMPa: 500,
    tensileStrengthMPa: 600,
    elongationAfterRupturePercent: 14,
    uniformElongationPercent: null,
    totalElongationAtMaximumLoadPercent: 5,
    bendAngleDegrees: 90,
    mandrelDiameterFactor: 3,
    elasticModulusGPa: 190,
  },
  {
    className: "A600",
    sourceStandard: "ДСТУ 3760:2006, табл. 5",
    electroHeatingTemperatureC: 400,
    yieldStrengthMPa: 600,
    tensileStrengthMPa: 800,
    elongationAfterRupturePercent: 12,
    uniformElongationPercent: 4,
    totalElongationAtMaximumLoadPercent: 5,
    bendAngleDegrees: 45,
    mandrelDiameterFactor: 5,
    elasticModulusGPa: 190,
  },
  {
    className: "A600C",
    sourceStandard: "ДСТУ 3760:2006, табл. 5",
    electroHeatingTemperatureC: 400,
    yieldStrengthMPa: 600,
    tensileStrengthMPa: 800,
    elongationAfterRupturePercent: 12,
    uniformElongationPercent: 4,
    totalElongationAtMaximumLoadPercent: 5,
    bendAngleDegrees: 45,
    mandrelDiameterFactor: 5,
    elasticModulusGPa: 190,
  },
  {
    className: "A600K",
    sourceStandard: "ДСТУ 3760:2006, табл. 5",
    electroHeatingTemperatureC: 400,
    yieldStrengthMPa: 600,
    tensileStrengthMPa: 800,
    elongationAfterRupturePercent: 12,
    uniformElongationPercent: 4,
    totalElongationAtMaximumLoadPercent: 5,
    bendAngleDegrees: 45,
    mandrelDiameterFactor: 5,
    elasticModulusGPa: 190,
  },
  {
    className: "A800",
    sourceStandard: "ДСТУ 3760:2006, табл. 5",
    electroHeatingTemperatureC: 400,
    yieldStrengthMPa: 800,
    tensileStrengthMPa: 1000,
    elongationAfterRupturePercent: 8,
    uniformElongationPercent: 2,
    totalElongationAtMaximumLoadPercent: 3.5,
    bendAngleDegrees: 45,
    mandrelDiameterFactor: 5,
    elasticModulusGPa: 190,
  },
  {
    className: "A800K",
    sourceStandard: "ДСТУ 3760:2006, табл. 5",
    electroHeatingTemperatureC: 400,
    yieldStrengthMPa: 800,
    tensileStrengthMPa: 1000,
    elongationAfterRupturePercent: 8,
    uniformElongationPercent: 2,
    totalElongationAtMaximumLoadPercent: 3.5,
    bendAngleDegrees: 45,
    mandrelDiameterFactor: 5,
    elasticModulusGPa: 190,
  },
  {
    className: "A800CK",
    sourceStandard: "ДСТУ 3760:2006, табл. 5",
    electroHeatingTemperatureC: 400,
    yieldStrengthMPa: 800,
    tensileStrengthMPa: 1000,
    elongationAfterRupturePercent: 8,
    uniformElongationPercent: 2,
    totalElongationAtMaximumLoadPercent: 3.5,
    bendAngleDegrees: 45,
    mandrelDiameterFactor: 5,
    elasticModulusGPa: 190,
  },
  {
    className: "A1000",
    sourceStandard: "ДСТУ 3760:2006, табл. 5",
    electroHeatingTemperatureC: 450,
    yieldStrengthMPa: 1000,
    tensileStrengthMPa: 1250,
    elongationAfterRupturePercent: 7,
    uniformElongationPercent: 2,
    totalElongationAtMaximumLoadPercent: 3.5,
    bendAngleDegrees: 45,
    mandrelDiameterFactor: 5,
    elasticModulusGPa: 190,
  },
] as const satisfies readonly RebarClassCharacteristics[];

export function getRebarAreaSquareMillimeters(
  diameterMillimeters: number,
  count = 1,
): number {
  return count * (Math.PI * diameterMillimeters ** 2) / 4;
}

export function getRebarAreaPerMeterSquareMillimeters(
  diameterMillimeters: number,
  spacingMillimeters: number,
): number {
  if (!Number.isFinite(spacingMillimeters) || spacingMillimeters <= 0) {
    return 0;
  }

  return (getRebarAreaSquareMillimeters(diameterMillimeters) * 1000) / spacingMillimeters;
}

const REBAR_MATERIALS = REBAR_DIAMETERS.map((diameterMm) => ({
  diameterMm,
  areaMm2: getRebarAreaSquareMillimeters(diameterMm),
})) satisfies RebarMaterial[];

export function getRebarMaterials(): RebarMaterial[] {
  return REBAR_MATERIALS.map((material) => ({ ...material }));
}

export function getRebarAreaByDiameter(diameterMm: number): number | undefined {
  return REBAR_MATERIALS.find((material) => material.diameterMm === diameterMm)?.areaMm2;
}

export function getRebarClasses(): RebarClassName[] {
  return REBAR_CLASS_CHARACTERISTICS.map((rebarClass) => rebarClass.className);
}

export function getRebarByClass(
  rebarClassName: string,
): RebarClassCharacteristics | undefined {
  const rebarClass = REBAR_CLASS_CHARACTERISTICS.find(
    (item) => item.className === rebarClassName,
  );

  return rebarClass ? { ...rebarClass } : undefined;
}

export function getRebarDesignValues(
  rebarClassName: string,
  factors: RebarDesignFactors = DEFAULT_REBAR_DESIGN_FACTORS,
): RebarDesignValues | undefined {
  const rebarClass = getRebarByClass(rebarClassName);

  if (!rebarClass) {
    return undefined;
  }

  const gammaS = factors.gammaS ?? DEFAULT_REBAR_DESIGN_FACTORS.gammaS;

  if (!Number.isFinite(gammaS) || gammaS <= 0) {
    return undefined;
  }

  return {
    fydMPa: rebarClass.yieldStrengthMPa / gammaS,
  };
}
