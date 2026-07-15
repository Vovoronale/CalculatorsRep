import { describe, expect, it } from "vitest";

import {
  DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT,
  getConcreteExposureClassReport,
  getConcreteExposureClassReturnUrl,
  type ConcreteExposureClassInput,
} from "@/lib/concrete-exposure-class";

function reportFor(input: Partial<ConcreteExposureClassInput>) {
  return getConcreteExposureClassReport({
    ...DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT,
    ...input,
  });
}

describe("getConcreteExposureClassReport", () => {
  it("uses formal DBN table 4.1 X0 wording with RH limit", () => {
    const report = reportFor({ carbonationExposureRow: "X0" });
    const step = report.steps.find((item) => item.key === "x0-xc");

    expect(report.valid).toBe(true);
    expect(report.values?.exposureClasses).toEqual(["X0"]);
    expect(report.values?.governingCoverExposureClass).toBe("X0");
    expect(step?.caption).toBe(
      "Визначення класу X0/XC за карбонізацією або відсутністю агресивних дій (ДБН В.2.6-98:2009, таблиця 4.1, рядки X0, XC1-XC4):",
    );
    expect(step?.items).toContain("Рядок таблиці 4.1: X0");
    expect(step?.items).toContain(
      "Характеристика середовища: Відсутнє поперемінно заморожування-відтавання, хімічні дії, стирання тощо. Дуже сухий повітряно-вологісний режим (RH <= 30 %).",
    );
    expect(step?.items).toContain("Мінімальний клас бетону за таблицею 4.1: C8/10");
    expect(step?.formula).toBe(
      "X0/XC = рядок таблиці 4.1: Відсутнє поперемінно заморожування-відтавання, хімічні дії, стирання тощо. Дуже сухий повітряно-вологісний режим (RH <= 30 %). => X0",
    );
  });

  it("maps formal XC rows and keeps the RH ranges in report formulas", () => {
    const xc1 = reportFor({ carbonationExposureRow: "XC1" });
    const xc3 = reportFor({ carbonationExposureRow: "XC3" });

    expect(xc1.values?.exposureClasses).toEqual(["XC1"]);
    expect(xc1.steps.find((step) => step.key === "x0-xc")?.formula).toBe(
      "X0/XC = рядок таблиці 4.1: Сухий повітряно-вологісний режим (30 % < RH <= 60 %) або постійна експлуатація у вологонасиченому стані. => XC1",
    );
    expect(xc3.values?.exposureClasses).toEqual(["XC3"]);
    expect(xc3.steps.find((step) => step.key === "x0-xc")?.formula).toBe(
      "X0/XC = рядок таблиці 4.1: Помірний повітряно-вологісний режим (60 % < RH <= 75 %) або експлуатація в умовах епізодичного вологонасичення. => XC3",
    );
  });

  it("maps XD rows directly from DBN table 4.1", () => {
    const report = reportFor({
      carbonationExposureRow: "XC2",
      xdExposureRow: "XD1",
    });
    const step = report.steps.find((item) => item.key === "xd-chlorides");

    expect(report.values?.exposureClasses).toEqual(["XC2", "XD1"]);
    expect(step?.items).toContain(
      "Характеристика середовища: Вологий, в умовах повітряно-вологісного стану (RH > 75 %) за відсутності епізодичного водонасичення.",
    );
    expect(step?.items).toContain("Мінімальний клас бетону за таблицею 4.1: C25/30");
    expect(step?.formula).toBe(
      "XD = рядок таблиці 4.1: Вологий, в умовах повітряно-вологісного стану (RH > 75 %) за відсутності епізодичного водонасичення. => XD1",
    );
  });

  it("keeps XS as a separate DSTU ENV/EN 206 block", () => {
    const report = reportFor({
      carbonationExposureRow: "XC2",
      xsExposureRow: "XS2",
    });
    const step = report.steps.find((item) => item.key === "xs-marine-chlorides");

    expect(report.values?.exposureClasses).toEqual(["XC2", "XS2"]);
    expect(step?.caption).toBe(
      "Визначення класу дії хлоридів морського походження XS (ДСТУ ENV/EN 206, група XS; у ДБН В.2.6-98:2009 таблиці 4.3 і 4.4 класи XS враховані разом із XD):",
    );
    expect(step?.notes).toContain(
      "У наданому PDF ДБН В.2.6-98:2009 класи XS1-XS3 не наведені як рядки таблиці 4.1.",
    );
    expect(step?.formula).toBe(
      "XS = клас хлоридів морського походження за ДСТУ ENV/EN 206 => XS2",
    );
  });

  it("maps XF and XA rows from DBN table 4.1 and adds durability requirements", () => {
    const report = reportFor({
      carbonationExposureRow: "XC4",
      xfExposureRow: "XF4",
      xaExposureRow: "XA3",
      hasChemicalAggressivenessConfirmation: true,
    });

    expect(report.values?.exposureClasses).toEqual(["XC4", "XF4", "XA3"]);
    expect(report.steps.find((step) => step.key === "xf-freeze-thaw")?.caption).toBe(
      "Визначення класу поперемінного заморожування-відтавання XF (ДБН В.2.6-98:2009, таблиця 4.1, рядки XF1-XF4):",
    );
    expect(report.steps.find((step) => step.key === "xf-freeze-thaw")?.formula).toBe(
      "XF = рядок таблиці 4.1: Водонасичений стан, застосовують антиобморожувачі. => XF4",
    );
    expect(report.steps.find((step) => step.key === "xa-chemical-attack")?.caption).toBe(
      "Визначення класу хімічних та біологічних дій XA (ДБН В.2.6-98:2009, таблиця 4.1, рядки XA1-XA3; ДСТУ Б В.2.6-145 для класифікації агресивності середовища):",
    );
    expect(report.steps.find((step) => step.key === "xa-chemical-attack")?.formula).toBe(
      "XA = рядок таблиці 4.1: Сильноагресивне середовище.; підтвердження = так => XA3",
    );
    expect(report.values?.additionalDurabilityRequirements).toEqual([
      "Для класу XF необхідно перевірити вимоги до морозостійкості бетону, водонасичення, водонепроникності, повітровтягування та складу бетонної суміші.",
      "Для класу XA необхідно перевірити хімічну агресивність середовища та потребу у спеціальному захисті бетону.",
    ]);
  });

  it("reports DBN minimum concrete classes for selected table 4.1 rows and excludes XS", () => {
    const report = reportFor({
      carbonationExposureRow: "XC4",
      xdExposureRow: "XD3",
      xsExposureRow: "XS3",
      xfExposureRow: "XF2",
      xaExposureRow: "XA2",
      hasChemicalAggressivenessConfirmation: true,
    });
    const step = report.steps.find((item) => item.key === "dbn-minimum-concrete");

    expect(report.values?.dbnMinimumConcreteClasses).toEqual([
      { exposureClass: "XC4", minimumConcreteClass: "C25/30" },
      { exposureClass: "XD3", minimumConcreteClass: "C30/35" },
      { exposureClass: "XF2", minimumConcreteClass: "C20/25" },
      { exposureClass: "XA2", minimumConcreteClass: "C25/30" },
    ]);
    expect(step?.formula).toBe(
      "мінімальні класи бетону за таблицею 4.1 = [XC4: C25/30; XD3: C30/35; XF2: C20/25; XA2: C25/30]",
    );
  });

  it("warns when X0 is combined with aggressive exposure rows", () => {
    const report = reportFor({
      carbonationExposureRow: "X0",
      xfExposureRow: "XF1",
    });

    expect(report.values?.exposureClasses).toEqual(["X0", "XF1"]);
    expect(report.warnings).toContain(
      "Для X0 агресивні дії мають бути відсутні; вибрані додаткові класи впливу перевірте на сумісність із рядком X0 таблиці 4.1.",
    );
  });

  it("warns when X0 is combined with a marine chloride XS row", () => {
    const report = reportFor({
      carbonationExposureRow: "X0",
      xsExposureRow: "XS3",
    });

    expect(report.values?.exposureClasses).toEqual(["X0", "XS3"]);
    expect(report.warnings).toContain(
      "Для X0 агресивні дії мають бути відсутні; вибрані додаткові класи впливу перевірте на сумісність із рядком X0 таблиці 4.1.",
    );
  });

  it("keeps unknown XA classification out of exposure classes and emits the contract warning", () => {
    const report = reportFor({
      carbonationExposureRow: "XC2",
      xaExposureRow: "unknown_requires_classification",
    });

    expect(report.values?.exposureClasses).toEqual(["XC2"]);
    expect(report.warnings).toContain(
      "Для визначення класу XA потрібна класифікація агресивності середовища за ДСТУ Б В.2.6-145.",
    );
    expect(report.steps.find((step) => step.key === "xa-chemical-attack")?.formula).toBe(
      "XA = потрібна класифікація агресивності середовища за ДСТУ Б В.2.6-145",
    );
    expect(report.steps.find((step) => step.key === "class-set")?.formula).toBe(
      "класи впливу = union(XC2; XA потребує класифікації) = [XC2]",
    );
  });

  it("selects governing cover class by rank from X0 XC XD and XS", () => {
    const report = reportFor({
      carbonationExposureRow: "XC4",
      xdExposureRow: "XD3",
      xsExposureRow: "XS3",
      xfExposureRow: "XF4",
    });

    expect(report.values?.exposureClasses).toEqual(["XC4", "XD3", "XS3", "XF4"]);
    expect(report.values?.governingCoverExposureClass).toBe("XD3");
    expect(report.steps.find((step) => step.key === "governing-cover-class")?.formula).toBe(
      "керівний клас = max([XC4, XD3, XS3]) = XD3",
    );
  });

  it("keeps stable report step order and conclusion text", () => {
    const report = reportFor({
      elementName: "Балка Б-1",
      elementType: "beam",
      currentExposureClass: "XC1",
      carbonationExposureRow: "XC4",
    });

    expect(report.steps.map((step) => step.key)).toEqual([
      "inputs",
      "x0-xc",
      "xd-chlorides",
      "xs-marine-chlorides",
      "xf-freeze-thaw",
      "xa-chemical-attack",
      "class-set",
      "dbn-minimum-concrete",
      "governing-cover-class",
      "additional-requirements",
      "conclusion",
    ]);
    expect(report.steps[0].items).toContain("Назва елемента: Балка Б-1");
    expect(report.steps[0].items).toContain("Тип елемента: балка");
    expect(report.steps[0].items).toContain("Поточний клас у розрахунку захисного шару: XC1");
    expect(report.steps.at(-1)?.formula).toBe(
      "класи впливу => керівний клас = [XC4] => XC4",
    );
  });
});

describe("getConcreteExposureClassReturnUrl", () => {
  it("uses returnTo and returnField when they are provided", () => {
    expect(
      getConcreteExposureClassReturnUrl({
        returnTo: "/calculator/concrete-cover-durability",
        returnField: "exposureClass",
        governingCoverExposureClass: "XD3",
        exposureClasses: ["XC4", "XD3", "XF4"],
      }),
    ).toBe(
      "/calculator/concrete-cover-durability?exposureClass=XD3&sourceExposureClasses=XC4%2CXD3%2CXF4&sourceCalculator=concrete-exposure-class",
    );
  });

  it("uses the future concrete cover durability calculator as the default return target", () => {
    expect(
      getConcreteExposureClassReturnUrl({
        governingCoverExposureClass: "XC1",
        exposureClasses: ["XC1"],
      }),
    ).toBe(
      "/calculator/concrete-cover-durability?exposureClass=XC1&sourceExposureClasses=XC1&sourceCalculator=concrete-exposure-class",
    );
  });
});
