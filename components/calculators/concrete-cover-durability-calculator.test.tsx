import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
  getConcreteCoverDurabilityReport,
} from "@/lib/concrete-cover-durability";
import type { CalculatorInputField } from "@/lib/calculator-input-schema";

import {
  CONCRETE_COVER_DURABILITY_INPUT_SCHEMA,
  ConcreteCoverDurabilityCalculator,
  buildConcreteCoverDurabilityDocxReport,
  getConcreteCoverDurabilityInitialValues,
} from "./concrete-cover-durability-calculator";

function findSchemaField(id: string): CalculatorInputField {
  for (const group of CONCRETE_COVER_DURABILITY_INPUT_SCHEMA.groups) {
    const field = group.fields.find((item) => item.id === id);
    if (field) return field;
  }
  throw new Error(`Missing schema field ${id}`);
}

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
  vi.restoreAllMocks();
});

describe("CONCRETE_COVER_DURABILITY_INPUT_SCHEMA", () => {
  it("defines inspector groups and the exposure-class calculator action", () => {
    expect(CONCRETE_COVER_DURABILITY_INPUT_SCHEMA.groups.map((group) => group.title)).toEqual([
      "Елемент і середовище",
      "cmin,b за зчепленням",
      "Клас конструкції S",
      "Поправки та допуск",
    ]);
    expect(findSchemaField("elementName")).toMatchObject({
      kind: "text",
      name: "Назва елемента",
      defaultValue: "Елемент",
    });
    expect(findSchemaField("exposureClass")).toMatchObject({
      kind: "select",
      name: "Клас впливу середовища",
      defaultValue: "XC1",
      calculatorAction: { label: "Розрахувати клас впливу" },
    });
    expect(findSchemaField("bondCoverMode")).toMatchObject({
      kind: "select",
      name: "Спосіб визначення cmin,b",
      defaultValue: "bar",
    });
    expect(findSchemaField("manualConstructionClass")).toMatchObject({
      showWhen: { fieldId: "constructionClassMode", equals: "manual" },
    });
    expect(findSchemaField("designWorkingLife")).toMatchObject({
      showWhen: { fieldId: "constructionClassMode", equals: "automatic" },
    });
    expect(findSchemaField("deltaCdevMm").description).toBe(
      "Допуск на відхил Δcdev додається до мінімального захисного шару для визначення номінального захисного шару cnom. За п. 4.4.3 ДБН В.2.6-98:2009 товщину мінімального захисного шару необхідно збільшити на абсолютне значення допустимого від'ємного відхилу. Рекомендоване значення за приміткою до п. 4.4.3: Δcdev = 10 мм.",
    );
  });
});

describe("ConcreteCoverDurabilityCalculator", () => {
  it("renders defaults, summary, report, norms, and DOCX action", () => {
    render(<ConcreteCoverDurabilityCalculator />);

    expect(
      screen.getByLabelText("Калькулятор захисного шару бетону для арматури"),
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Елемент і середовище" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Клас впливу середовища" })).toHaveValue("XC1");
    expect(
      screen.getByRole("button", { name: "Розрахувати клас впливу" }),
    ).toHaveAttribute("title", "Розрахувати клас впливу");
    expect(screen.getByText("Мінімальний захисний шар: cmin = 16 мм")).toBeInTheDocument();
    expect(screen.getByText("Номінальний захисний шар для креслень: cnom = 26 мм")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Покроковий звіт" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Нормативні посилання" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Завантажити DOCX" })).toBeInTheDocument();
  });

  it("renders a parametric concrete cover detail from the current result values", () => {
    const { container } = render(<ConcreteCoverDurabilityCalculator />);

    expect(screen.getByText("Позначення величин")).toBeInTheDocument();
    expect(
      screen.getByText("Параметричний вузол: cnom = 26 мм; d = 16 мм; a = 34 мм."),
    ).toBeInTheDocument();

    const svg = container.querySelector(".concrete-cover-durability-diagram__svg");
    expect(svg).toHaveAttribute(
      "aria-label",
      "Параметричний вузол захисного шару: cnom 26 мм, d 16 мм, a 34 мм",
    );
    expect(container.querySelector('[data-role="concrete-left-face"]')).toBeInTheDocument();
    expect(container.querySelector('[data-role="concrete-bottom-face"]')).toBeInTheDocument();
    expect(container.querySelector('[data-role="stirrup-outer-edge"]')).toBeInTheDocument();
    expect(svg?.querySelector("circle")).toHaveAttribute("r", "8");
  });

  it("renders DBN scans in the normative references section", () => {
    render(<ConcreteCoverDurabilityCalculator />);

    const expectedScans = [
      [
        "Скан п. 4.4.2.2 і формули (4.2) з ДБН В.2.6-98:2009",
        "/dbn/concrete-cover-durability/dbn-4-4-2-2-formula-4-2.png",
      ],
      [
        "Скан п. 4.4.2.3 і таблиці 4.2 з ДБН В.2.6-98:2009",
        "/dbn/concrete-cover-durability/dbn-table-4-2.png",
      ],
      [
        "Скан таблиці 4.3 з ДБН В.2.6-98:2009",
        "/dbn/concrete-cover-durability/dbn-table-4-3.png",
      ],
      [
        "Скан таблиці 4.4 з ДБН В.2.6-98:2009",
        "/dbn/concrete-cover-durability/dbn-table-4-4.png",
      ],
      [
        "Скан таблиці 4.5 з ДБН В.2.6-98:2009",
        "/dbn/concrete-cover-durability/dbn-table-4-5.png",
      ],
      [
        "Скан п. 4.4.2.4.4 з ДБН В.2.6-98:2009",
        "/dbn/concrete-cover-durability/dbn-4-4-2-4-4.png",
      ],
      [
        "Скан п. 4.4.3 з ДБН В.2.6-98:2009",
        "/dbn/concrete-cover-durability/dbn-4-4-3.png",
      ],
    ] as const;

    for (const [alt, src] of expectedScans) {
      expect(screen.getByAltText(alt)).toHaveAttribute("src", src);
    }
  });

  it("opens the exposure-class calculator through the inspector action", async () => {
    const originalLocation = window.location;
    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, assign },
    });
    const user = userEvent.setup();

    render(<ConcreteCoverDurabilityCalculator />);
    await user.click(screen.getByRole("button", { name: "Розрахувати клас впливу" }));

    expect(assign).toHaveBeenCalledTimes(1);
    const targetUrl = assign.mock.calls[0]?.[0] as string;
    const url = new URL(targetUrl, "https://ivapps.pro");
    expect(url.pathname).toBe("/calculator/concrete-exposure-class");
    expect(url.searchParams.get("returnTo")).toBe("/calculator/concrete-cover-durability");
    expect(url.searchParams.get("returnField")).toBe("exposureClass");
    expect(url.searchParams.get("returnLabel")).toBe("Розрахунок захисного шару");
    expect(url.searchParams.get("elementName")).toBe("Елемент");
    expect(url.searchParams.get("elementType")).toBe("other");
    expect(url.searchParams.get("reinforcementPresence")).toBe("reinforced_or_embedded_metal");
    expect(url.searchParams.get("currentExposureClass")).toBe("XC1");

    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("prefills exposure class and audit source from query parameters", () => {
    window.history.pushState(
      {},
      "",
      "/calculator/concrete-cover-durability?exposureClass=XD3&sourceExposureClasses=XC4%2CXD3%2CXF4&sourceCalculator=concrete-exposure-class",
    );

    const values = getConcreteCoverDurabilityInitialValues();

    expect(values.exposureClass).toBe("XD3");
    expect(values.sourceExposureClasses).toBe("XC4,XD3,XF4");
    expect(values.sourceCalculator).toBe("concrete-exposure-class");
  });

  it("shows conditional bond fields for the selected mode", async () => {
    const user = userEvent.setup();
    render(<ConcreteCoverDurabilityCalculator />);

    expect(screen.getByRole("textbox", { name: "Діаметр стрижня" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Менша сторона прямокутного каналу" })).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Спосіб визначення cmin,b" }),
      "rectangular-duct",
    );

    expect(screen.getByRole("textbox", { name: "Менша сторона прямокутного каналу" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Більша сторона прямокутного каналу" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Діаметр стрижня" })).not.toBeInTheDocument();
  });

  it("maps the report to the universal DOCX report contract", () => {
    const report = getConcreteCoverDurabilityReport({
      ...DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
    });
    const docxReport = buildConcreteCoverDurabilityDocxReport(
      report,
      new Date("2026-06-17T00:00:00.000Z"),
    );

    expect(docxReport).toMatchObject({
      title: "Покроковий звіт",
      fileBaseName: "zakhysnyi-shar-betonu-2026-06-17",
    });
    expect(docxReport.steps.map((step) => step.key)).toEqual(
      report.steps.map((step) => step.key),
    );
    expect(docxReport.steps[5].formula).toBe("cnom = cmin + Δcdev = 16 + 10 = 26 мм");
  });
});
