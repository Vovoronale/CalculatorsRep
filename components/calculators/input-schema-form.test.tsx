import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  convertBaseNumberToDisplay,
  convertDisplayNumberToBase,
  getDefaultInputSchemaValues,
  getVisibleInputSchemaGroups,
  validateInputSchemaValues,
  type CalculatorInputSchema,
  type CalculatorInputValues,
} from "@/lib/calculator-input-schema";

import { InputSchemaForm } from "./input-schema-form";

const schema: CalculatorInputSchema = {
  groups: [
    {
      id: "geometry",
      title: "Геометрія",
      fields: [
        {
          id: "spanM",
          kind: "number",
          prefix: { text: "l", subscript: "k", ariaLabel: "lk" },
          name: "Короткий проліт",
          defaultValue: "3",
          min: 0,
          step: "0.1",
          description: "Короткий проліт у вибраних одиницях.",
          quantity: "length",
          baseUnit: "m",
          defaultDisplayUnit: "m",
        },
        {
          id: "mode",
          kind: "select",
          name: "Режим",
          defaultValue: "auto",
          options: [
            { value: "auto", label: "Авто" },
            { value: "manual", label: "Вручну" },
          ],
        },
        {
          id: "manualFactor",
          kind: "number",
          name: "Коефіцієнт",
          defaultValue: "",
          min: 0,
          showWhen: { fieldId: "mode", equals: "manual" },
        },
        {
          id: "comment",
          kind: "text",
          name: "Коментар",
          defaultValue: "",
          required: true,
        },
      ],
    },
    {
      id: "options",
      title: "Опції",
      fields: [
        {
          id: "enabled",
          kind: "checkbox",
          name: "Увімкнути?",
          defaultValue: false,
        },
        {
          id: "variant",
          kind: "radio",
          name: "Варіант",
          defaultValue: "a",
          options: [
            { value: "a", label: "Item1" },
            { value: "b", label: "Item2" },
          ],
        },
        {
          id: "derived",
          kind: "derived",
          name: "Похідне",
          getValue: (values) => `${values.spanM} м`,
        },
      ],
    },
  ],
};

const defaultValues: CalculatorInputValues = {
  spanM: "3",
  mode: "auto",
  manualFactor: "",
  comment: "",
  enabled: false,
  variant: "a",
};

afterEach(() => {
  cleanup();
});

function StatefulInputSchemaForm({
  initialValues = defaultValues,
  onValuesChange,
}: {
  initialValues?: CalculatorInputValues;
  onValuesChange: (values: CalculatorInputValues) => void;
}) {
  const [values, setValues] = useState(initialValues);

  return (
    <InputSchemaForm
      schema={schema}
      values={values}
      onValuesChange={(nextValues) => {
        setValues(nextValues);
        onValuesChange(nextValues);
      }}
    />
  );
}

describe("calculator input schema", () => {
  it("returns default base values without unit fields", () => {
    expect(getDefaultInputSchemaValues(schema)).toEqual(defaultValues);
  });

  it("filters conditional fields using serializable rules", () => {
    expect(
      getVisibleInputSchemaGroups(schema, defaultValues)[0].fields.map((field) => field.id),
    ).toEqual(["spanM", "mode", "comment"]);

    expect(
      getVisibleInputSchemaGroups(schema, {
        ...defaultValues,
        mode: "manual",
      })[0].fields.map((field) => field.id),
    ).toEqual(["spanM", "mode", "manualFactor", "comment"]);
  });

  it("converts display numbers to base values and back", () => {
    expect(
      convertDisplayNumberToBase("125,5", { value: "cm", label: "см", factorToBase: 0.01 }),
    ).toBe("1.255");
    expect(
      convertBaseNumberToDisplay("1.255", { value: "cm", label: "см", factorToBase: 0.01 }),
    ).toBe("125.5");
    expect(
      convertDisplayNumberToBase("12.5", { value: "m", label: "м", factorToBase: 1 }),
    ).toBe("12.5");
  });

  it("preserves invalid number drafts during conversion", () => {
    expect(
      convertDisplayNumberToBase("12,", { value: "cm", label: "см", factorToBase: 0.01 }),
    ).toBe("12,");
    expect(
      convertBaseNumberToDisplay("abc", { value: "cm", label: "см", factorToBase: 0.01 }),
    ).toBe("abc");
  });

  it("validates comma and period decimals, required text, min, max, and option membership", () => {
    expect(
      validateInputSchemaValues(schema, { ...defaultValues, spanM: "1,5", comment: "ok" })
        .spanM,
    ).toBeUndefined();
    expect(
      validateInputSchemaValues(schema, { ...defaultValues, spanM: "1.5", comment: "ok" })
        .spanM,
    ).toBeUndefined();

    const errors = validateInputSchemaValues(
      {
        groups: [
          {
            id: "checks",
            title: "Checks",
            fields: [
              {
                id: "depthM",
                kind: "number",
                name: "Глибина",
                defaultValue: "1",
                required: true,
                min: 0,
                max: 5,
              },
              {
                id: "kind",
                kind: "select",
                name: "Тип",
                defaultValue: "a",
                options: [{ value: "a", label: "A" }],
              },
              {
                id: "note",
                kind: "text",
                name: "Примітка",
                defaultValue: "",
                required: true,
              },
            ],
          },
        ],
      },
      { depthM: "-1", kind: "b", note: "" },
    );

    expect(errors).toEqual({
      depthM: ["Значення має бути не менше 0."],
      kind: ["Оберіть значення зі списку."],
      note: ["Заповніть поле."],
    });

    expect(
      validateInputSchemaValues(schema, { ...defaultValues, spanM: "abc", comment: "ok" })
        .spanM,
    ).toEqual(["Введіть числове значення."]);
  });
});

describe("InputSchemaForm", () => {
  it("renders inspector groups, prefixes, names, units, controls, and derived values", () => {
    render(<InputSchemaForm schema={schema} values={defaultValues} onValuesChange={vi.fn()} />);

    expect(screen.getByRole("group", { name: "Геометрія" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Опції" })).toBeInTheDocument();
    expect(screen.getByText("Короткий проліт")).toBeInTheDocument();
    expect(screen.getByLabelText("Позначення lk")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Короткий проліт" })).toHaveValue("3");
    expect(screen.getByRole("combobox", { name: "Одиниця Короткий проліт" })).toHaveValue(
      "m",
    );
    expect(screen.getByRole("checkbox", { name: "Увімкнути?" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Item1" })).toBeChecked();
    expect(screen.getByText("3 м")).toBeInTheDocument();
  });

  it("updates number values as normalized base values and keeps invalid drafts", async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();

    render(<StatefulInputSchemaForm onValuesChange={onValuesChange} />);

    const input = screen.getByRole("textbox", { name: "Короткий проліт" });
    await user.clear(input);
    await user.type(input, "125,5");

    expect(onValuesChange).toHaveBeenLastCalledWith({
      ...defaultValues,
      spanM: "125.5",
    });

    await user.clear(screen.getByRole("textbox", { name: "Короткий проліт" }));
    await user.type(screen.getByRole("textbox", { name: "Короткий проліт" }), "abc");

    expect(onValuesChange).toHaveBeenLastCalledWith({
      ...defaultValues,
      spanM: "abc",
    });
  });

  it("changes display unit locally without emitting calculator values", async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();

    render(
      <StatefulInputSchemaForm
        initialValues={{ ...defaultValues, spanM: "1.25" }}
        onValuesChange={onValuesChange}
      />,
    );

    await user.selectOptions(screen.getByRole("combobox", { name: "Одиниця Короткий проліт" }), "cm");

    expect(screen.getByRole("textbox", { name: "Короткий проліт" })).toHaveValue("125");
    expect(onValuesChange).not.toHaveBeenCalled();

    await user.clear(screen.getByRole("textbox", { name: "Короткий проліт" }));
    await user.type(screen.getByRole("textbox", { name: "Короткий проліт" }), "126,5");

    expect(onValuesChange).toHaveBeenLastCalledWith({
      ...defaultValues,
      spanM: "1.265",
    });
  });

  it("resolves display units from field quantity", async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();

    render(
      <StatefulInputSchemaForm
        initialValues={{ ...defaultValues, spanM: "1.25" }}
        onValuesChange={onValuesChange}
      />,
    );

    const unitSelect = screen.getByRole("combobox", { name: "Одиниця Короткий проліт" });

    expect(unitSelect).toHaveValue("m");
    expect(within(unitSelect).getByRole("option", { name: "м" })).toHaveValue("m");
    expect(within(unitSelect).getByRole("option", { name: "см" })).toHaveValue("cm");
    expect(within(unitSelect).getByRole("option", { name: "мм" })).toHaveValue("mm");

    await user.selectOptions(unitSelect, "cm");

    expect(screen.getByRole("textbox", { name: "Короткий проліт" })).toHaveValue("125");
    expect(onValuesChange).not.toHaveBeenCalled();

    await user.clear(screen.getByRole("textbox", { name: "Короткий проліт" }));
    await user.type(screen.getByRole("textbox", { name: "Короткий проліт" }), "126,5");

    expect(onValuesChange).toHaveBeenLastCalledWith({
      ...defaultValues,
      spanM: "1.265",
    });
  });

  it("renders a single available display unit as a read-only combobox", () => {
    const singleUnitSchema: CalculatorInputSchema = {
      groups: [
        {
          id: "single-unit",
          title: "Single unit",
          fields: [
            {
              id: "depthM",
              kind: "number",
              name: "Глибина",
              defaultValue: "1.2",
              quantity: "unitWeight",
              baseUnit: "kn-m3",
              defaultDisplayUnit: "kn-m3",
            },
          ],
        },
      ],
    };

    render(
      <InputSchemaForm
        schema={singleUnitSchema}
        values={{ depthM: "1.2" }}
        onValuesChange={vi.fn()}
      />,
    );

    const unitSelect = screen.getByRole("combobox", { name: "Одиниця Глибина" });

    expect(unitSelect).toBeDisabled();
    expect(unitSelect).toHaveAttribute("aria-readonly", "true");
    expect(unitSelect).toHaveValue("kn-m3");
  });

  it("renders coefficient quantities without a unit combobox", () => {
    const coefficientSchema: CalculatorInputSchema = {
      groups: [
        {
          id: "coefficients",
          title: "Coefficients",
          fields: [
            {
              id: "gammaC1",
              kind: "number",
              name: "Коефіцієнт умов роботи",
              defaultValue: "1.2",
              quantity: "coefficient",
            },
            {
              id: "depthM",
              kind: "number",
              name: "Глибина",
              defaultValue: "1.2",
              defaultDisplayUnit: "m",
              displayUnits: [{ value: "m", label: "м", factorToBase: 1 }],
            },
          ],
        },
      ],
    };

    render(
      <InputSchemaForm
        schema={coefficientSchema}
        values={{ gammaC1: "1.2", depthM: "1.2" }}
        onValuesChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("combobox", { name: "Одиниця Коефіцієнт умов роботи" }),
    ).not.toBeInTheDocument();
  });

  it("updates select, text, checkbox, radio and renders conditional fields", async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();

    render(<StatefulInputSchemaForm onValuesChange={onValuesChange} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Режим" }), "manual");
    expect(onValuesChange).toHaveBeenLastCalledWith({ ...defaultValues, mode: "manual" });

    await user.type(screen.getByRole("textbox", { name: "Коментар" }), "abc");
    expect(onValuesChange).toHaveBeenLastCalledWith({
      ...defaultValues,
      mode: "manual",
      comment: "abc",
    });

    await user.click(screen.getByRole("checkbox", { name: "Увімкнути?" }));
    expect(onValuesChange).toHaveBeenLastCalledWith({
      ...defaultValues,
      mode: "manual",
      comment: "abc",
      enabled: true,
    });

    await user.click(screen.getByRole("radio", { name: "Item2" }));
    expect(onValuesChange).toHaveBeenLastCalledWith({
      ...defaultValues,
      mode: "manual",
      comment: "abc",
      enabled: true,
      variant: "b",
    });

    expect(screen.getByRole("textbox", { name: "Коефіцієнт" })).toBeInTheDocument();
  });

  it("opens inline help and field errors from row actions", async () => {
    const user = userEvent.setup();

    render(
      <InputSchemaForm
        schema={schema}
        values={defaultValues}
        onValuesChange={vi.fn()}
        validationErrors={{ spanM: ["Значення має бути не менше 0."] }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Показати опис поля Короткий проліт" }));
    expect(screen.getByText("Короткий проліт у вибраних одиницях.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Показати помилку поля Короткий проліт" }));
    const detail = screen
      .getByText("Значення має бути не менше 0.")
      .closest(".input-schema-field__details");

    expect(detail).not.toBeNull();
    expect(
      within(detail as HTMLElement).getByText("Короткий проліт у вибраних одиницях."),
    ).toBeInTheDocument();
  });

  it("closes inline details when the active action is clicked again", async () => {
    const user = userEvent.setup();

    render(<InputSchemaForm schema={schema} values={defaultValues} onValuesChange={vi.fn()} />);

    const helpButton = screen.getByRole("button", {
      name: "Показати опис поля Короткий проліт",
    });

    await user.click(helpButton);
    expect(screen.getByText("Короткий проліт у вибраних одиницях.")).toBeInTheDocument();

    await user.click(helpButton);
    expect(screen.queryByText("Короткий проліт у вибраних одиницях.")).not.toBeInTheDocument();
  });
});
