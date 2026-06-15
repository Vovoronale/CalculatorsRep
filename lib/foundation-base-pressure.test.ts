import { describe, expect, it } from "vitest";

import {
  DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT,
  getFoundationBasePressureReport,
} from "@/lib/foundation-base-pressure";

describe("foundation base pressure calculator", () => {
  it("reproduces the two-corner uplift example", () => {
    const report = getFoundationBasePressureReport(
      DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT,
    );

    expect(report.valid).toBe(true);
    expect(report.values).toMatchObject({
      selfWeightT: expect.closeTo(17.28, 6),
      totalVerticalForceT: expect.closeTo(43.28, 6),
      areaM2: expect.closeTo(4.32, 6),
      sectionModulusWyM3: expect.closeTo(1.728, 6),
      sectionModulusWxM3: expect.closeTo(1.296, 6),
      baseMomentXTm: expect.closeTo(2.8, 6),
      baseMomentYTm: expect.closeTo(24.1, 6),
      eccentricityXM: expect.closeTo(0.5568, 4),
      eccentricityYM: expect.closeTo(0.0647, 4),
      noUpliftCornerStressesTM2: [
        expect.closeTo(26.13, 2),
        expect.closeTo(21.8, 2),
        expect.closeTo(-1.77, 2),
        expect.closeTo(-6.09, 2),
      ],
      uplift: {
        type: "two-corners",
        c1M: expect.closeTo(0.2781, 4),
        c2M: expect.closeTo(0.6927, 4),
        upliftSharePercent: expect.closeTo(20.2, 1),
        contactStressesTM2: [
          expect.closeTo(27.73, 2),
          expect.closeTo(22.31, 2),
        ],
      },
    });
    expect(report.steps.map((step) => step.key)).toContain("uplift-two-corners");
    expect(JSON.stringify(report.steps)).not.toContain("p0");
    expect(JSON.stringify(report.steps)).not.toContain("p0, ax, ay");
    expect(report.steps.find((step) => step.key === "contact-model")).toMatchObject({
      caption: expect.stringContaining("Вибір схеми відриву підошви"),
      notes: [
        "Найменше з обчислених напружень менше нуля, тому маємо відрив підошви.",
        "Визначаємо від'ємні кутові напруження: σ3 = -1.77 т/м², σ4 = -6.09 т/м².",
        "За розташуванням від'ємних кутів вибираємо схему відриву: трапеція.",
      ],
    });
    expect(report.steps.find((step) => step.key === "uplift-two-corners")).toMatchObject({
      notes: [
        "Від'ємні напруження отримані у двох суміжних кутах однієї грані, тому зона відриву має форму трапеції.",
        "Лінія σ = 0 перетинає дві протилежні грані підошви: c1 — відстань від точки 3 до перетину на верхній грані, c2 — відстань від точки 4 до перетину на нижній грані.",
        "Після виключення зони відриву контакт зберігається в точках 1 і 2.",
      ],
      formulas: [
        "c1 = x_top = 0.2781 м",
        "c2 = x_bottom = 0.6927 м",
        "A_lift = (c1 + c2) / 2 * b = (0.2781 + 0.6927) / 2 * 1.80 = 0.8737 м²",
        "P_lift = A_lift / A * 100 = 0.8737 / 4.320 * 100 = 20.2%",
        "σ1 = 27.73 т/м²",
        "σ2 = 22.31 т/м²",
      ],
    });
  });

  it("reproduces the one-corner uplift example", () => {
    const report = getFoundationBasePressureReport({
      ...DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT,
      momentXTm: 9,
    });

    expect(report.valid).toBe(true);
    expect(report.values?.noUpliftCornerStressesTM2).toEqual([
      expect.closeTo(31.53, 2),
      expect.closeTo(16.4, 2),
      expect.closeTo(3.63, 2),
      expect.closeTo(-11.49, 2),
    ]);
    expect(report.values?.uplift).toMatchObject({
      type: "one-corner",
      c1M: expect.closeTo(1.734, 4),
      c2M: expect.closeTo(1.3427, 4),
      upliftSharePercent: expect.closeTo(26.9, 1),
      contactStressesTM2: [
        expect.closeTo(36.39, 2),
        expect.closeTo(15.7, 2),
        expect.closeTo(0.76, 2),
      ],
    });
    expect(report.steps.find((step) => step.key === "contact-model")).toMatchObject({
      notes: [
        "Найменше з обчислених напружень менше нуля, тому маємо відрив підошви.",
        "Визначаємо від'ємні кутові напруження: σ4 = -11.49 т/м².",
        "За розташуванням від'ємного кута вибираємо схему відриву: трикутник.",
      ],
    });
    expect(report.steps.find((step) => step.key === "uplift-one-corner")).toMatchObject({
      notes: [
        "Від'ємне напруження отримане в одному куті, тому зона відриву має форму трикутника.",
        "Лінія σ = 0 перетинає дві суміжні грані підошви: c1 — сторона трикутної зони відриву вздовж b, c2 — сторона трикутної зони відриву вздовж l.",
        "Після виключення зони відриву контакт зберігається в точках 1, 2 і 3.",
      ],
      formulas: [
        "c1 = y_left = 1.7340 м",
        "c2 = x_bottom = 1.3427 м",
        "A_lift = c1 * c2 / 2 = 1.7340 * 1.3427 / 2 = 1.1641 м²",
        "P_lift = A_lift / A * 100 = 1.1641 / 4.320 * 100 = 26.9%",
        "σ1 = 36.39 т/м²",
        "σ2 = 15.70 т/м²",
        "σ3 = 0.76 т/м²",
      ],
    });
  });

  it("returns final corner stresses when uplift is absent", () => {
    const report = getFoundationBasePressureReport({
      ...DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT,
      momentXTm: 0,
      momentYTm: 0,
      shearXT: 0,
      shearYT: 0,
    });

    expect(report.valid).toBe(true);
    expect(report.values?.uplift).toMatchObject({ type: "none" });
    expect(report.warnings).toEqual([]);
  });

  it("does not include unresolved source-name placeholder text in report captions", () => {
    const report = getFoundationBasePressureReport(
      DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT,
    );

    expect(JSON.stringify(report.steps)).not.toContain(
      "назву джерела буде уточнено користувачем",
    );
  });

  it("renders equilibrium checks as formulas with substitutions", () => {
    const report = getFoundationBasePressureReport(
      DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT,
    );
    const equilibriumStep = report.steps.find((step) => step.key === "equilibrium");

    expect(equilibriumStep?.items).toBeUndefined();
    expect(equilibriumStep?.formulas).toEqual([
      "ΣP = ∫A p(x, y) dA = 43.28 т ≈ N_total = 43.28 т",
      "ΣMx = ∫A (y - b / 2) * p(x, y) dA = N_total * (y_R - b / 2) = 43.28 * (0.9647 - 0.9000) = 2.80 т·м ≈ Mx_base = 2.80 т·м",
      "ΣMy = ∫A (x - l / 2) * p(x, y) dA = N_total * (x_R - l / 2) = 43.28 * (1.7568 - 1.2000) = 24.10 т·м ≈ My_base = 24.10 т·м",
    ]);
  });

  it("validates dimensions and avoids non-finite formulas", () => {
    const report = getFoundationBasePressureReport({
      ...DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT,
      foundationLengthM: 0,
    });

    expect(report.valid).toBe(false);
    expect(report.errors).toEqual(["l має бути більше 0."]);
    expect(JSON.stringify(report.steps)).not.toContain("NaN");
  });
});
