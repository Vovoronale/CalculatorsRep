import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import {
  SteelStructureCategoryGroupCalculator,
  buildSteelStructureCategoryGroupInputSchema,
} from "./steel-structure-category-group-calculator";

afterEach(cleanup);

describe("steel structure category/group schema", () => {
  it("uses two dependent selectors and agreed defaults", () => {
    const schema = buildSteelStructureCategoryGroupInputSchema({
      sectionId: "a1-section-03",
      structureId: "a1-03-03",
      steelClass: "С245",
      productType: "section",
    });
    const fields = schema.groups.flatMap((group) => group.fields);
    const structure = fields.find((field) => field.id === "structureId");

    expect(fields.find((field) => field.id === "sectionId")).toMatchObject({
      defaultValue: "a1-section-03",
      options: expect.arrayContaining([
        expect.objectContaining({ value: "a1-section-01" }),
        expect.objectContaining({ value: "a1-section-18" }),
      ]),
    });
    expect(structure).toMatchObject({
      defaultValue: "a1-03-03",
      options: expect.arrayContaining([
        expect.objectContaining({ value: "a1-03-03", label: expect.stringContaining("А/III") }),
      ]),
    });
    expect((structure as { options: unknown[] }).options).toHaveLength(8);
    expect(fields.find((field) => field.id === "thicknessMm")).toMatchObject({
      quantity: "thickness",
      baseUnit: "mm",
      defaultDisplayUnit: "mm",
    });
  });
});

describe("SteelStructureCategoryGroupCalculator", () => {
  it("renders the agreed default result and report", () => {
    render(<SteelStructureCategoryGroupCalculator />);

    expect(screen.getByLabelText("Калькулятор категорій і груп сталевих конструкцій")).toHaveClass(
      "native-calculator",
    );
    expect(screen.getByText(/Початкова група: 3/)).toBeInTheDocument();
    expect(screen.getByText(/Уточнена група: 3/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Покроковий звіт" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Завантажити DOCX" })).toBeInTheDocument();
    expect(screen.getByAltText("Скан таблиці 5.1 з ДБН В.2.6-198:2014")).toHaveAttribute(
      "src",
      "/dbn/steel-structure-category-group/dbn-table-5-1-part-1.png",
    );
    expect(screen.getAllByText("Скан фрагмента ДБН")).toHaveLength(10);
  });

  it("filters and resets the structure selector when section changes", async () => {
    const user = userEvent.setup();
    render(<SteelStructureCategoryGroupCalculator />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Розділ таблиці А.1" }), "a1-section-06");

    const structure = screen.getByRole("combobox", { name: "Конструкція або елемент" });
    expect(structure).toHaveValue("a1-06-01");
    expect(screen.getByRole("option", { name: /Стояки — Б\/II/ })).toBeInTheDocument();
  });

  it("switches between semi-automatic and manual gamma c controls", async () => {
    const user = userEvent.setup();
    render(<SteelStructureCategoryGroupCalculator />);

    const mode = screen.getByRole("combobox", { name: "Режим визначення γc" });
    await user.selectOptions(mode, "table");
    expect(screen.getByRole("combobox", { name: "Позиція таблиці 5.1" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Коефіцієнт умов роботи" })).not.toBeInTheDocument();

    await user.selectOptions(mode, "manual");
    const manualPreset = screen.getByRole("combobox", { name: "Значення γc" });
    expect(manualPreset).toHaveValue("1");
    expect(screen.queryByRole("textbox", { name: "Коефіцієнт умов роботи" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Позиція таблиці 5.1" })).not.toBeInTheDocument();

    await user.selectOptions(manualPreset, "custom");
    expect(screen.getByRole("textbox", { name: "Коефіцієнт умов роботи" })).toHaveValue("1");
  });
});
