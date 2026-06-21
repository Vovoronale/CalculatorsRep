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
    expect(findSchemaField("limitedUseGreeneryAreaM2")).toMatchObject({
      name: "Фактична площа зелених насаджень обмеженого користування",
      defaultValue: "",
      min: 0,
      baseUnit: "m2",
      defaultDisplayUnit: "m2",
      showWhen: { fieldId: "physicalCultureMode", equals: "reduced" },
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
    expect(fields.map((field) => field.description).join(" ")).not.toMatch(
      /користувач|калькулятор|алгоритм/iu,
    );
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
    ]) {
      expect(within(results).getByText(text)).toBeInTheDocument();
    }
    expect(within(results).getByText("S_(прибуд) = 457,2 м²")).toBeInTheDocument();
    expect(within(results).getByText("S_(твар) = 30 м²")).toBeInTheDocument();
    expect(within(results).queryByText(/S_?\(?тер\)?/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Розрахунок площ майданчиків у складі прибудинкової території",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Покроковий звіт" })).not.toBeInTheDocument();
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
    const greenery = screen.getByLabelText(
      "Фактична площа зелених насаджень обмеженого користування",
    );
    expect(greenery).toHaveValue("");
    await user.click(zone);
    await user.type(greenery, "600");
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
    expect(
      screen.getByLabelText("Фактична площа зелених насаджень обмеженого користування"),
    ).toHaveValue("");
  });

  it("uses the reduced norm after the numeric greenery check passes", async () => {
    const user = userEvent.setup();
    render(<ResidentialYardAreasCalculator />);

    await user.selectOptions(
      screen.getByLabelText("Норматив площі фізкультурних майданчиків"),
      "reduced",
    );
    await user.click(
      screen.getByLabelText("Передбачена окрема озеленена фізкультурна зона"),
    );
    await user.type(
      screen.getByLabelText("Фактична площа зелених насаджень обмеженого користування"),
      "600",
    );

    expect(screen.getAllByText("S_(прибуд) = 277,2 м²").length).toBeGreaterThan(0);
    const table = screen.getByRole("table");
    expect(within(table).getByText("S_(твар) = 30 м²")).toBeInTheDocument();
  });

  it("falls back to the full norm when actual greenery is insufficient", async () => {
    const user = userEvent.setup();
    render(<ResidentialYardAreasCalculator />);
    const mode = screen.getByLabelText(
      "Норматив площі фізкультурних майданчиків",
    );

    await user.selectOptions(
      mode,
      "reduced",
    );
    await user.click(
      screen.getByLabelText("Передбачена окрема озеленена фізкультурна зона"),
    );
    const greenery = screen.getByLabelText(
      "Фактична площа зелених насаджень обмеженого користування",
    );
    await user.type(greenery, "599");

    expect(
      screen.getByText(
        "Зменшений норматив не можна застосувати: фактична площа зелених насаджень обмеженого користування має бути не меншою за 600 м².",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Умови застосування зменшеного нормативу не виконано; розрахунок виконано за повним нормативом.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("S_(прибуд) = 457,2 м²").length).toBeGreaterThan(0);
    expect(greenery.closest(".input-schema-field")).toHaveAttribute(
      "data-invalid",
      "true",
    );
    expect(mode.closest(".input-schema-field")).not.toHaveAttribute(
      "data-invalid",
    );
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

    expect(screen.getAllByText(/S_\(відх,руч\) = 0,08 ар = 8 м²/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("S_(відх) = 8 м²").length).toBeGreaterThan(0);
  });

  it("links every residential-yard normative card to its DBN", () => {
    render(<ResidentialYardAreasCalculator />);

    const links = Array.from(
      document.querySelectorAll<HTMLAnchorElement>(".dbn-source-link"),
    );
    expect(links).toHaveLength(4);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "https://e-construction.gov.ua/laws_detail/3874277768581612585?doc_type=2",
      "https://e-construction.gov.ua/laws_detail/3874277768581612585?doc_type=2",
      "https://e-construction.gov.ua/laws_detail/3874277768581612585?doc_type=2",
      "https://e-construction.gov.ua/laws_detail/3875034753086261244?doc_type=2",
    ]);
    for (const link of links) {
      expect(link).toHaveTextContent("Відкрити ДБН на e-construction");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("links report citations to the five normative scans and opens the target", async () => {
    const user = userEvent.setup();
    render(<ResidentialYardAreasCalculator />);

    expect(
      screen.getByRole("heading", { name: "Нормативні посилання" }),
    ).toBeInTheDocument();

    const expectedScans = [
      "dbn-b-2-2-12-table-6-4.png",
      "dbn-b-2-2-12-table-6-4-notes.png",
      "dbn-b-2-2-12-table-6-5.png",
      "dbn-b-2-2-12-table-10-5.png",
      "dbn-v-2-3-15-4-6-table-1.png",
    ];
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(expectedScans.length);
    for (const fileName of expectedScans) {
      expect(images.some((image) => image.getAttribute("src")?.endsWith(fileName))).toBe(
        true,
      );
    }

    const target = document.getElementById(
      "residential-yard-norm-table-10-5",
    ) as HTMLDetailsElement;
    expect(target).not.toHaveAttribute("open");
    const link = screen.getAllByRole("link", { name: "таблиця 10.5" })[0];
    expect(link).toHaveAttribute(
      "href",
      "#residential-yard-norm-table-10-5",
    );
    await user.click(link);
    expect(target).toHaveAttribute("open");
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
    expect(docxReport.title).toBe(
      "Розрахунок площ майданчиків у складі прибудинкової території",
    );
    expect(docxReport.includeStepHeading).toBe(false);
    expect(docxReport.steps.map((step) => step.key)).toEqual(
      report.steps.map((step) => step.key),
    );
  });
});
