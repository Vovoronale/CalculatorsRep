import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import type { CalculatorInputField } from "@/lib/calculator-input-schema";

import {
  CONCRETE_EXPOSURE_CLASS_INPUT_SCHEMA,
  ConcreteExposureClassCalculator,
  getConcreteExposureClassInitialValues,
} from "./concrete-exposure-class-calculator";

function findSchemaField(id: string): CalculatorInputField {
  for (const group of CONCRETE_EXPOSURE_CLASS_INPUT_SCHEMA.groups) {
    const field = group.fields.find((item) => item.id === id);
    if (field) return field;
  }
  throw new Error(`Missing schema field ${id}`);
}

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("CONCRETE_EXPOSURE_CLASS_INPUT_SCHEMA", () => {
  it("defines the agreed input fields and conditional chloride and analysis fields", () => {
    expect(CONCRETE_EXPOSURE_CLASS_INPUT_SCHEMA.groups.map((group) => group.title)).toEqual([
      "Елемент",
      "Корозія арматури",
      "Хлориди",
      "Мороз і хімічна агресія",
    ]);
    expect(findSchemaField("elementName")).toMatchObject({
      kind: "text",
      name: "Назва елемента",
      defaultValue: "Елемент",
    });
    expect(findSchemaField("chlorideMoistureCondition")).toMatchObject({
      name: "Вологісний режим для хлоридів",
      showWhen: { fieldId: "chlorideSource", notEquals: "none" },
    });
    expect(findSchemaField("hasSoilOrGroundwaterAnalysis")).toMatchObject({
      name: "Є аналіз ґрунту або води",
      showWhen: { fieldId: "chemicalAttackRisk", notEquals: "none" },
    });
  });

  it("uses readable XA labels in the chemical attack options", () => {
    const field = findSchemaField("chemicalAttackRisk");

    if (field.kind !== "select") {
      throw new Error("chemicalAttackRisk must be a select field");
    }

    expect(field.options.map((option) => option.label)).toEqual([
      "Немає ознак хімічної агресії",
      "XA1 — слабка хімічна агресія",
      "XA2 — помірна хімічна агресія",
      "XA3 — сильна хімічна агресія",
      "Невідомо — потрібен аналіз ґрунту або води",
    ]);
  });
});

describe("getConcreteExposureClassInitialValues", () => {
  it("prefills shared fields from calculator 1 query parameters", () => {
    window.history.pushState(
      {},
      "",
      "/calculator/concrete-exposure-class?elementName=%D0%91%D0%B0%D0%BB%D0%BA%D0%B0%20%D0%91-1&elementType=beam&reinforcementPresence=reinforced_or_embedded_metal&currentExposureClass=XC1&returnTo=%2Fcalculator%2Fconcrete-cover-durability&returnField=exposureClass&returnLabel=%D0%A0%D0%BE%D0%B7%D1%80%D0%B0%D1%85%D1%83%D0%BD%D0%BE%D0%BA%20%D0%B7%D0%B0%D1%85%D0%B8%D1%81%D0%BD%D0%BE%D0%B3%D0%BE%20%D1%88%D0%B0%D1%80%D1%83",
    );

    expect(getConcreteExposureClassInitialValues()).toMatchObject({
      elementName: "Балка Б-1",
      elementType: "beam",
      reinforcementPresence: "reinforced_or_embedded_metal",
      currentExposureClass: "XC1",
    });
  });
});

describe("ConcreteExposureClassCalculator", () => {
  it("renders result summary, report, and default return link", () => {
    render(<ConcreteExposureClassCalculator />);

    expect(
      screen.getByLabelText("Калькулятор класу впливу середовища для бетону"),
    ).toHaveClass("native-calculator");
    expect(screen.getByText("Повний набір класів: XC1")).toBeInTheDocument();
    expect(screen.getByText("Для розрахунку захисного шару прийнято: XC1")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Покроковий звіт" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Використати в розрахунку захисного шару" }),
    ).toHaveAttribute(
      "href",
      "/calculator/concrete-cover-durability?exposureClass=XC1&sourceExposureClasses=XC1&sourceCalculator=concrete-exposure-class",
    );
  });

  it("shows conditional chloride field and updates governing class", async () => {
    const user = userEvent.setup();

    render(<ConcreteExposureClassCalculator />);

    expect(
      screen.queryByRole("combobox", { name: "Вологісний режим для хлоридів" }),
    ).not.toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: "Джерело хлоридів" }), "deicing_salts");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Вологісний режим для хлоридів" }),
      "splash_or_spray",
    );

    expect(screen.getByText("Повний набір класів: XC1, XD3")).toBeInTheDocument();
    expect(screen.getByText("Для розрахунку захисного шару прийнято: XD3")).toBeInTheDocument();
  });

  it("prefills from query params and returns to calculator 1", () => {
    window.history.pushState(
      {},
      "",
      "/calculator/concrete-exposure-class?elementName=%D0%91%D0%B0%D0%BB%D0%BA%D0%B0%20%D0%91-1&elementType=beam&reinforcementPresence=reinforced_or_embedded_metal&currentExposureClass=XC1&returnTo=%2Fcalculator%2Fconcrete-cover-durability&returnField=exposureClass&returnLabel=%D0%A0%D0%BE%D0%B7%D1%80%D0%B0%D1%85%D1%83%D0%BD%D0%BE%D0%BA%20%D0%B7%D0%B0%D1%85%D0%B8%D1%81%D0%BD%D0%BE%D0%B3%D0%BE%20%D1%88%D0%B0%D1%80%D1%83",
    );

    render(<ConcreteExposureClassCalculator />);

    expect(screen.getByRole("textbox", { name: "Назва елемента" })).toHaveValue("Балка Б-1");
    expect(screen.getByRole("combobox", { name: "Тип елемента" })).toHaveValue("beam");
    expect(screen.getByText("Поточний клас у розрахунку захисного шару: XC1")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Повернути клас XC1 у розрахунок захисного шару" }),
    ).toHaveAttribute(
      "href",
      "/calculator/concrete-cover-durability?exposureClass=XC1&sourceExposureClasses=XC1&sourceCalculator=concrete-exposure-class",
    );
  });

  it("shows XA warning after selecting unknown chemical attack", async () => {
    const user = userEvent.setup();

    render(<ConcreteExposureClassCalculator />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Хімічна агресія" }),
      "unknown_requires_analysis",
    );

    expect(screen.getByText("Для визначення класу XA потрібен аналіз ґрунту або води.")).toBeInTheDocument();
    const report = screen.getByRole("region", { name: "Покроковий звіт" });
    expect(within(report).getByText(/XA не призначається остаточно/)).toBeInTheDocument();
  });
});
