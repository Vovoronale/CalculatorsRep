export type ConcreteClassName =
  | "C8/10"
  | "C12/15"
  | "C16/20"
  | "C20/25"
  | "C25/30"
  | "C30/37"
  | "C35/45"
  | "C40/50"
  | "C45/55"
  | "C50/60"
  | "C55/67"
  | "C60/75"
  | "C70/85"
  | "C80/95"
  | "C90/105";

export type ConcreteCharacteristics = {
  className: ConcreteClassName;
  fckMPa: number;
  fckCubeMPa: number;
  fcmMPa: number;
  fctmMPa: number;
  fctk005MPa: number;
  fctk095MPa: number;
  ecmGPa: number;
  epsilonC1PerMille: number;
  epsilonCu1PerMille: number;
  epsilonC2PerMille: number;
  epsilonCu2PerMille: number;
  n: number;
  epsilonC3PerMille: number;
  epsilonCu3PerMille: number;
};

export type ConcreteDesignFactors = {
  gammaC?: number;
  alphaCc?: number;
  alphaCt?: number;
};

export type ConcreteDesignValues = {
  fcdMPa: number;
  fctdMPa: number;
};

export const DEFAULT_CONCRETE_DESIGN_FACTORS = {
  gammaC: 1.5,
  alphaCc: 1,
  alphaCt: 1,
} as const;

export const CONCRETE_CHARACTERISTICS = [
  {
    className: "C8/10",
    fckMPa: 8,
    fckCubeMPa: 10,
    fcmMPa: 16,
    fctmMPa: 1.2,
    fctk005MPa: 0.8,
    fctk095MPa: 1.6,
    ecmGPa: 25,
    epsilonC1PerMille: 1.7,
    epsilonCu1PerMille: 3.5,
    epsilonC2PerMille: 2,
    epsilonCu2PerMille: 3.5,
    n: 2,
    epsilonC3PerMille: 1.75,
    epsilonCu3PerMille: 3.5,
  },
  {
    className: "C12/15",
    fckMPa: 12,
    fckCubeMPa: 15,
    fcmMPa: 20,
    fctmMPa: 1.6,
    fctk005MPa: 1.1,
    fctk095MPa: 2,
    ecmGPa: 27,
    epsilonC1PerMille: 1.8,
    epsilonCu1PerMille: 3.5,
    epsilonC2PerMille: 2,
    epsilonCu2PerMille: 3.5,
    n: 2,
    epsilonC3PerMille: 1.75,
    epsilonCu3PerMille: 3.5,
  },
  {
    className: "C16/20",
    fckMPa: 16,
    fckCubeMPa: 20,
    fcmMPa: 24,
    fctmMPa: 1.9,
    fctk005MPa: 1.3,
    fctk095MPa: 2.5,
    ecmGPa: 29,
    epsilonC1PerMille: 1.9,
    epsilonCu1PerMille: 3.5,
    epsilonC2PerMille: 2,
    epsilonCu2PerMille: 3.5,
    n: 2,
    epsilonC3PerMille: 1.75,
    epsilonCu3PerMille: 3.5,
  },
  {
    className: "C20/25",
    fckMPa: 20,
    fckCubeMPa: 25,
    fcmMPa: 28,
    fctmMPa: 2.2,
    fctk005MPa: 1.5,
    fctk095MPa: 2.9,
    ecmGPa: 30,
    epsilonC1PerMille: 2,
    epsilonCu1PerMille: 3.5,
    epsilonC2PerMille: 2,
    epsilonCu2PerMille: 3.5,
    n: 2,
    epsilonC3PerMille: 1.75,
    epsilonCu3PerMille: 3.5,
  },
  {
    className: "C25/30",
    fckMPa: 25,
    fckCubeMPa: 30,
    fcmMPa: 33,
    fctmMPa: 2.6,
    fctk005MPa: 1.8,
    fctk095MPa: 3.3,
    ecmGPa: 31,
    epsilonC1PerMille: 2.1,
    epsilonCu1PerMille: 3.5,
    epsilonC2PerMille: 2,
    epsilonCu2PerMille: 3.5,
    n: 2,
    epsilonC3PerMille: 1.75,
    epsilonCu3PerMille: 3.5,
  },
  {
    className: "C30/37",
    fckMPa: 30,
    fckCubeMPa: 37,
    fcmMPa: 38,
    fctmMPa: 2.9,
    fctk005MPa: 2,
    fctk095MPa: 3.8,
    ecmGPa: 33,
    epsilonC1PerMille: 2.2,
    epsilonCu1PerMille: 3.5,
    epsilonC2PerMille: 2,
    epsilonCu2PerMille: 3.5,
    n: 2,
    epsilonC3PerMille: 1.75,
    epsilonCu3PerMille: 3.5,
  },
  {
    className: "C35/45",
    fckMPa: 35,
    fckCubeMPa: 45,
    fcmMPa: 43,
    fctmMPa: 3.2,
    fctk005MPa: 2.2,
    fctk095MPa: 4.2,
    ecmGPa: 34,
    epsilonC1PerMille: 2.25,
    epsilonCu1PerMille: 3.5,
    epsilonC2PerMille: 2,
    epsilonCu2PerMille: 3.5,
    n: 2,
    epsilonC3PerMille: 1.75,
    epsilonCu3PerMille: 3.5,
  },
  {
    className: "C40/50",
    fckMPa: 40,
    fckCubeMPa: 50,
    fcmMPa: 48,
    fctmMPa: 3.5,
    fctk005MPa: 2.5,
    fctk095MPa: 4.6,
    ecmGPa: 35,
    epsilonC1PerMille: 2.3,
    epsilonCu1PerMille: 3.5,
    epsilonC2PerMille: 2,
    epsilonCu2PerMille: 3.5,
    n: 2,
    epsilonC3PerMille: 1.75,
    epsilonCu3PerMille: 3.5,
  },
  {
    className: "C45/55",
    fckMPa: 45,
    fckCubeMPa: 55,
    fcmMPa: 53,
    fctmMPa: 3.8,
    fctk005MPa: 2.7,
    fctk095MPa: 4.9,
    ecmGPa: 36,
    epsilonC1PerMille: 2.4,
    epsilonCu1PerMille: 3.5,
    epsilonC2PerMille: 2,
    epsilonCu2PerMille: 3.5,
    n: 2,
    epsilonC3PerMille: 1.75,
    epsilonCu3PerMille: 3.5,
  },
  {
    className: "C50/60",
    fckMPa: 50,
    fckCubeMPa: 60,
    fcmMPa: 58,
    fctmMPa: 4.1,
    fctk005MPa: 2.9,
    fctk095MPa: 5.3,
    ecmGPa: 37,
    epsilonC1PerMille: 2.45,
    epsilonCu1PerMille: 3.5,
    epsilonC2PerMille: 2,
    epsilonCu2PerMille: 3.5,
    n: 2,
    epsilonC3PerMille: 1.75,
    epsilonCu3PerMille: 3.5,
  },
  {
    className: "C55/67",
    fckMPa: 55,
    fckCubeMPa: 67,
    fcmMPa: 63,
    fctmMPa: 4.2,
    fctk005MPa: 3,
    fctk095MPa: 5.5,
    ecmGPa: 38,
    epsilonC1PerMille: 2.5,
    epsilonCu1PerMille: 3.2,
    epsilonC2PerMille: 2.2,
    epsilonCu2PerMille: 3.1,
    n: 1.75,
    epsilonC3PerMille: 1.8,
    epsilonCu3PerMille: 3.1,
  },
  {
    className: "C60/75",
    fckMPa: 60,
    fckCubeMPa: 75,
    fcmMPa: 68,
    fctmMPa: 4.4,
    fctk005MPa: 3.1,
    fctk095MPa: 5.7,
    ecmGPa: 39,
    epsilonC1PerMille: 2.6,
    epsilonCu1PerMille: 3,
    epsilonC2PerMille: 2.3,
    epsilonCu2PerMille: 2.9,
    n: 1.6,
    epsilonC3PerMille: 1.9,
    epsilonCu3PerMille: 2.9,
  },
  {
    className: "C70/85",
    fckMPa: 70,
    fckCubeMPa: 85,
    fcmMPa: 78,
    fctmMPa: 4.6,
    fctk005MPa: 3.2,
    fctk095MPa: 6,
    ecmGPa: 41,
    epsilonC1PerMille: 2.7,
    epsilonCu1PerMille: 2.8,
    epsilonC2PerMille: 2.4,
    epsilonCu2PerMille: 2.7,
    n: 1.45,
    epsilonC3PerMille: 2,
    epsilonCu3PerMille: 2.7,
  },
  {
    className: "C80/95",
    fckMPa: 80,
    fckCubeMPa: 95,
    fcmMPa: 88,
    fctmMPa: 4.8,
    fctk005MPa: 3.4,
    fctk095MPa: 6.3,
    ecmGPa: 42,
    epsilonC1PerMille: 2.8,
    epsilonCu1PerMille: 2.8,
    epsilonC2PerMille: 2.5,
    epsilonCu2PerMille: 2.6,
    n: 1.4,
    epsilonC3PerMille: 2.2,
    epsilonCu3PerMille: 2.6,
  },
  {
    className: "C90/105",
    fckMPa: 90,
    fckCubeMPa: 105,
    fcmMPa: 98,
    fctmMPa: 5,
    fctk005MPa: 3.5,
    fctk095MPa: 6.6,
    ecmGPa: 44,
    epsilonC1PerMille: 2.8,
    epsilonCu1PerMille: 2.8,
    epsilonC2PerMille: 2.6,
    epsilonCu2PerMille: 2.6,
    n: 1.4,
    epsilonC3PerMille: 2.3,
    epsilonCu3PerMille: 2.6,
  },
] as const satisfies readonly ConcreteCharacteristics[];

export function getConcreteClasses(): ConcreteClassName[] {
  return CONCRETE_CHARACTERISTICS.map((concrete) => concrete.className);
}

export function getConcreteByClass(
  concreteClass: string,
): ConcreteCharacteristics | undefined {
  const concrete = CONCRETE_CHARACTERISTICS.find(
    (item) => item.className === concreteClass,
  );

  return concrete ? { ...concrete } : undefined;
}

export function getConcreteDesignValues(
  concreteClass: string,
  factors: ConcreteDesignFactors = DEFAULT_CONCRETE_DESIGN_FACTORS,
): ConcreteDesignValues | undefined {
  const concrete = getConcreteByClass(concreteClass);

  if (!concrete) {
    return undefined;
  }

  const gammaC = factors.gammaC ?? DEFAULT_CONCRETE_DESIGN_FACTORS.gammaC;
  const alphaCc = factors.alphaCc ?? DEFAULT_CONCRETE_DESIGN_FACTORS.alphaCc;
  const alphaCt = factors.alphaCt ?? DEFAULT_CONCRETE_DESIGN_FACTORS.alphaCt;

  if (!Number.isFinite(gammaC) || gammaC <= 0) {
    return undefined;
  }

  return {
    fcdMPa: (alphaCc * concrete.fckMPa) / gammaC,
    fctdMPa: (alphaCt * concrete.fctk005MPa) / gammaC,
  };
}
