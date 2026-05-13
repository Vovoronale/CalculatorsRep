export type RebarAreaUnit = "mm2" | "cm2" | "m2";

export {
  REBAR_DIAMETERS,
  REBAR_SPACINGS,
  getRebarAreaPerMeterSquareMillimeters,
  getRebarAreaSquareMillimeters,
} from "@/lib/materials/rebar";

import {
  REBAR_DIAMETERS,
  REBAR_SPACINGS,
  getRebarAreaPerMeterSquareMillimeters,
  getRebarAreaSquareMillimeters,
} from "@/lib/materials/rebar";

export type RebarCombination = {
  diameter: number;
  count: number;
  areaSquareMillimeters: number;
};

export type RebarSpacingCombination = {
  diameter: number;
  spacingMillimeters: number;
  areaSquareMillimeters: number;
};

export type RebarSelection = {
  bestMatch: RebarCombination | null;
  eligibleKeys: Set<string>;
};

export type RebarSpacingSelection = {
  bestMatch: RebarSpacingCombination | null;
  eligibleKeys: Set<string>;
};

export const REBAR_AREA_UNITS: Record<
  RebarAreaUnit,
  { label: string; factorToSquareMillimeters: number; fractionDigits: number }
> = {
  mm2: {
    label: "мм²",
    factorToSquareMillimeters: 1,
    fractionDigits: 2,
  },
  cm2: {
    label: "см²",
    factorToSquareMillimeters: 100,
    fractionDigits: 3,
  },
  m2: {
    label: "м²",
    factorToSquareMillimeters: 1_000_000,
    fractionDigits: 8,
  },
};

const BASE_BAR_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const INTERNAL_MAXIMUM_AREA_FACTOR = 1.26;

export function clampRebarCount(count: number): number {
  if (!Number.isFinite(count)) {
    return 10;
  }
  return Math.max(1, Math.round(count));
}

export function clampRebarSpacing(spacingMillimeters: number): number {
  if (!Number.isFinite(spacingMillimeters)) {
    return 400;
  }
  return Math.max(1, Math.round(spacingMillimeters));
}

export function getRebarBarCounts(customCount: number): number[] {
  return [...BASE_BAR_COUNTS, clampRebarCount(customCount)];
}

export function getRebarSpacingColumns(customSpacingMillimeters: number): number[] {
  return [...REBAR_SPACINGS, clampRebarSpacing(customSpacingMillimeters)];
}

export function convertAreaToSquareMillimeters(
  value: number,
  unit: RebarAreaUnit,
): number {
  return value * REBAR_AREA_UNITS[unit].factorToSquareMillimeters;
}

export function getRebarMaximumAreaSquareMillimeters(
  requiredAreaSquareMillimeters: number,
): number {
  if (
    !Number.isFinite(requiredAreaSquareMillimeters) ||
    requiredAreaSquareMillimeters <= 0
  ) {
    return 0;
  }

  return requiredAreaSquareMillimeters * INTERNAL_MAXIMUM_AREA_FACTOR;
}

export function formatRebarArea(
  areaSquareMillimeters: number,
  unit: RebarAreaUnit,
): string {
  const unitConfig = REBAR_AREA_UNITS[unit];
  return (areaSquareMillimeters / unitConfig.factorToSquareMillimeters).toFixed(
    unitConfig.fractionDigits,
  );
}

export function formatRebarUtilization(
  requiredAreaSquareMillimeters: number,
  actualAreaSquareMillimeters: number,
): string {
  if (
    !Number.isFinite(requiredAreaSquareMillimeters) ||
    !Number.isFinite(actualAreaSquareMillimeters) ||
    requiredAreaSquareMillimeters <= 0 ||
    actualAreaSquareMillimeters <= 0
  ) {
    return "";
  }

  return `${((actualAreaSquareMillimeters / requiredAreaSquareMillimeters) * 100).toFixed(1)}%`;
}

export function getRebarCombinationKey(diameter: number, count: number): string {
  return `${diameter}:${count}`;
}

export function getRebarSpacingCombinationKey(
  diameter: number,
  spacingMillimeters: number,
): string {
  return `${diameter}:${spacingMillimeters}`;
}

export function getRebarSelection({
  requiredAreaSquareMillimeters,
  maximumAreaSquareMillimeters,
  customCount,
}: {
  requiredAreaSquareMillimeters: number;
  maximumAreaSquareMillimeters?: number;
  customCount: number;
}): RebarSelection {
  const eligibleKeys = new Set<string>();

  if (
    !Number.isFinite(requiredAreaSquareMillimeters) ||
    requiredAreaSquareMillimeters <= 0
  ) {
    return { bestMatch: null, eligibleKeys };
  }

  let bestMatch: RebarCombination | null = null;
  const upperLimit =
    Number.isFinite(maximumAreaSquareMillimeters) &&
    maximumAreaSquareMillimeters !== undefined &&
    maximumAreaSquareMillimeters > 0
      ? maximumAreaSquareMillimeters
      : getRebarMaximumAreaSquareMillimeters(requiredAreaSquareMillimeters);

  for (const diameter of REBAR_DIAMETERS) {
    for (const count of getRebarBarCounts(customCount)) {
      const areaSquareMillimeters = getRebarAreaSquareMillimeters(
        diameter,
        count,
      );

      if (
        areaSquareMillimeters < requiredAreaSquareMillimeters ||
        areaSquareMillimeters > upperLimit
      ) {
        continue;
      }

      eligibleKeys.add(getRebarCombinationKey(diameter, count));

      if (
        !bestMatch ||
        areaSquareMillimeters < bestMatch.areaSquareMillimeters ||
        (areaSquareMillimeters === bestMatch.areaSquareMillimeters &&
          diameter < bestMatch.diameter)
      ) {
        bestMatch = {
          diameter,
          count,
          areaSquareMillimeters,
        };
      }
    }
  }

  return { bestMatch, eligibleKeys };
}

export function getRebarSpacingSelection({
  requiredAreaSquareMillimeters,
  customSpacingMillimeters = 400,
}: {
  requiredAreaSquareMillimeters: number;
  customSpacingMillimeters?: number;
}): RebarSpacingSelection {
  const eligibleKeys = new Set<string>();

  if (
    !Number.isFinite(requiredAreaSquareMillimeters) ||
    requiredAreaSquareMillimeters <= 0
  ) {
    return { bestMatch: null, eligibleKeys };
  }

  let bestMatch: RebarSpacingCombination | null = null;
  const upperLimit = getRebarMaximumAreaSquareMillimeters(requiredAreaSquareMillimeters);

  for (const diameter of REBAR_DIAMETERS) {
    for (const spacingMillimeters of getRebarSpacingColumns(customSpacingMillimeters)) {
      const areaSquareMillimeters = getRebarAreaPerMeterSquareMillimeters(
        diameter,
        spacingMillimeters,
      );

      if (
        areaSquareMillimeters < requiredAreaSquareMillimeters ||
        areaSquareMillimeters > upperLimit
      ) {
        continue;
      }

      eligibleKeys.add(getRebarSpacingCombinationKey(diameter, spacingMillimeters));

      if (
        !bestMatch ||
        areaSquareMillimeters < bestMatch.areaSquareMillimeters ||
        (areaSquareMillimeters === bestMatch.areaSquareMillimeters &&
          diameter < bestMatch.diameter)
      ) {
        bestMatch = {
          diameter,
          spacingMillimeters,
          areaSquareMillimeters,
        };
      }
    }
  }

  return { bestMatch, eligibleKeys };
}
