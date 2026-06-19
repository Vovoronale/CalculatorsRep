import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import type { CalculatorInputField } from "@/lib/calculator-input-schema";
import {
  DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
  getResidentialYardAreasReport,
} from "@/lib/residential-yard-areas";

import {
  RESIDENTIAL_YARD_AREAS_INPUT_SCHEMA,
  ResidentialYardAreasCalculator,
  buildResidentialYardAreasDocxReport,
} from "./residential-yard-areas-calculator";

afterEach(cleanup);

function findSchemaField(id: string): CalculatorInputField {
  for (const group of RESIDENTIAL_YARD_AREAS_INPUT_SCHEMA.groups) {
    const field = group.fields.find((item) => item.id === id);
    if (field) return field;
  }
  throw new Error(`Missing schema field ${id}`);
}

describe("RESIDENTIAL_YARD_AREAS_INPUT_SCHEMA", () => {
  it("defines the approved defaults, units, and display conditions", () => {
    expect(findSchemaField("residents")).toMatchObject({
      defaultValue: "100",
      min: 1,
      step: "1",
    });
    expect(findSchemaField("oneRoomApartments")).toMatchObject({
      defaultValue: "0",
      min: 0,
      step: "1",
    });
    expect(findSchemaField("twoOrMoreRoomApartments")).toMatchObject({
      defaultValue: "40",
      min: 0,
      step: "1",
    });
    expect(findSchemaField("manualVacuumAreaM2")).toMatchObject({
      defaultDisplayUnit: "m2",
      showWhen: { fieldId: "wasteCollectionMethod", equals: "vacuum" },
      displayUnits: [
        { value: "m2", label: "м²", factorToBase: 1 },
        { value: "a", label: "ар", factorToBase: 100 },
        { value: "ha", label: "га", factorToBase: 10000 },
      ],
    });
    expect(findSchemaField("householdAreaPerPersonM2")).toMatchObject({
      defaultValue: "0.1",
      min: 0.1,
      max: 0.3,
      showWhen: { fieldId: "hasHouseholdPurposeAreas", equals: true },
    });
  });

  it("gives every user field a practical description and exact source", () => {
    const fields = RESIDENTIAL_YARD_AREAS_INPUT_SCHEMA.groups.flatMap(
      (group) => group.fields,
    );

    expect(fields).toHaveLength(11);
    for (const field of fields) {
      expect(field.description).toBeTruthy();
      expect(field.description).toMatch(/Джерело:/);
      expect(field.description).not.toBe(field.name);
    }
  });
});

describe("ResidentialYardAreasCalculator", () => {
  it("renders every approved default result, report, and DOCX action", () => {
    render(<ResidentialYardAreasCalculator />);

    expect(
      screen.getByLabelText("Калькулятор площ прибудинкових майданчиків"),
    ).toHaveClass("native-calculator");
    const results = screen.getByLabelText("Результати розрахунку площ майданчиків");
    for (const text of [
      "Дитячі майданчики",
      "Відпочинок дорослих",
      "Фізкультурні майданчики",
      "Гостьова стоянка",
      "Стоянка велосипедів",
      "Збирання відходів",
      "Господарські майданчики",
      "Вигул домашніх тварин",
      "У межах прибудинкової території",
      "Загальна територіальна потреба",
    ]) {
      expect(within(results).getByText(text)).toBeInTheDocument();
    }
    expect(within(results).getByText("Sприбуд = 457,2 м²")).toBeInTheDocument();
    expect(within(results).getByText("Sтер = 487,2 м²")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Покроковий звіт" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Завантажити DOCX" })).toBeInTheDocument();
  });

  it("shows conditional fields and resets their values when controllers change", async () => {
    const user = userEvent.setup();
    render(<ResidentialYardAreasCalculator />);

    expect(
      screen.queryByLabelText("Передбачена окрема озеленена фізкультурна зона"),
    ).not.toBeInTheDocument();
    await user.selectOptions(
      screen.getByLabelText("Норматив площі фізкультурних майданчиків"),
      "reduced",
    );
    const zone = screen.getByLabelText(
      "Передбачена окрема озеленена фізкультурна зона",
    );
    await user.click(zone);
    expect(zone).toBeChecked();
    await user.selectOptions(
      screen.getByLabelText("Норматив площі фізкультурних майданчиків"),
      "full",
    );
    await user.selectOptions(
      screen.getByLabelText("Норматив площі фізкультурних майданчиків"),
      "reduced",
    );
    expect(
      screen.getByLabelText("Передбачена окрема озеленена фізкультурна зона"),
    ).not.toBeChecked();
  });

  it("normalizes an are input and reports the selected unit conversion", async () => {
    const user = userEvent.setup();
    render(<ResidentialYardAreasCalculator />);

    await user.selectOptions(
      screen.getByLabelText("Спосіб збирання побутових відходів"),
      "vacuum",
    );
    await user.selectOptions(
      screen.getByLabelText("Одиниця Площа майданчика за технічними умовами"),
      "a",
    );
    const areaInput = screen.getByLabelText(
      "Площа майданчика за технічними умовами",
    );
    await user.clear(areaInput);
    await user.type(areaInput, "0,08");

    expect(screen.getAllByText(/Sвідх,руч = 0,08 ар = 8 м²/).length).toBeGreaterThan(0);
    expect(screen.getByText("Sвідх = 8 м²")).toBeInTheDocument();
  });
});

describe("residential yard DOCX export", () => {
  it("maps the canonical report into the shared DOCX model", () => {
    const report = getResidentialYardAreasReport(
      DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
    );
    const docxReport = buildResidentialYardAreasDocxReport(
      report,
      new Date("2026-06-20"),
    );

    expect(docxReport.fileBaseName).toBe(
      "ploshchi-prybudynkovykh-maidanchykiv-2026-06-20",
    );
    expect(docxReport.steps.map((step) => step.key)).toEqual(
      report.steps.map((step) => step.key),
    );
  });
});
