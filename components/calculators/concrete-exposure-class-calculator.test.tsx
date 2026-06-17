import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import type { CalculatorInputField } from "@/lib/calculator-input-schema";

import {
  CONCRETE_EXPOSURE_CLASS_INPUT_SCHEMA,
  ConcreteExposureClassCalculator,
  buildConcreteExposureClassDocxReport,
  getConcreteExposureClassInitialValues,
} from "./concrete-exposure-class-calculator";

function findSchemaField(id: string): CalculatorInputField {
  for (const group of CONCRETE_EXPOSURE_CLASS_INPUT_SCHEMA.groups) {
    const field = group.fields.find((item) => item.id === id);
    if (field) return field;
  }
  throw new Error(`Missing schema field ${id}`);
}

function getHelpButton(fieldName: string): HTMLButtonElement | null {
  return document.querySelector(
    `button[aria-label="Показати опис поля ${fieldName}"]`,
  );
}

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

describe("CONCRETE_EXPOSURE_CLASS_INPUT_SCHEMA", () => {
  it("defines formal DBN row-driven input fields", () => {
    expect(CONCRETE_EXPOSURE_CLASS_INPUT_SCHEMA.groups.map((group) => group.title)).toEqual([
      "Елемент",
      "X0/XC за таблицею 4.1",
      "Хлориди",
      "XF та XA за таблицею 4.1",
    ]);
    expect(findSchemaField("elementName")).toMatchObject({
      kind: "text",
      name: "Назва елемента",
      defaultValue: "Елемент",
    });
    expect(findSchemaField("carbonationExposureRow")).toMatchObject({
      kind: "select",
      name: "Рядок X0/XC таблиці 4.1",
      defaultValue: "X0",
    });
    expect(findSchemaField("xdExposureRow")).toMatchObject({
      kind: "select",
      name: "Рядок XD таблиці 4.1",
      defaultValue: "none",
    });
    expect(findSchemaField("xsExposureRow")).toMatchObject({
      kind: "select",
      name: "Клас XS за ДСТУ ENV/EN 206",
      defaultValue: "none",
    });
    expect(findSchemaField("xfExposureRow")).toMatchObject({
      kind: "select",
      name: "Рядок XF таблиці 4.1",
      defaultValue: "none",
    });
    expect(findSchemaField("xaExposureRow")).toMatchObject({
      kind: "select",
      name: "Рядок XA таблиці 4.1",
      defaultValue: "none",
    });
    expect(findSchemaField("hasChemicalAggressivenessConfirmation")).toMatchObject({
      name: "Класифікацію агресивності підтверджено за ДСТУ Б В.2.6-145",
      showWhen: { fieldId: "xaExposureRow", notEquals: "none" },
    });
    expect(() => findSchemaField("moistureCondition")).toThrow(
      "Missing schema field moistureCondition",
    );
    expect(() => findSchemaField("chlorideSource")).toThrow(
      "Missing schema field chlorideSource",
    );
    expect(() => findSchemaField("freezeThawRisk")).toThrow(
      "Missing schema field freezeThawRisk",
    );
    expect(() => findSchemaField("chemicalAttackRisk")).toThrow(
      "Missing schema field chemicalAttackRisk",
    );
  });

  it("uses formal DBN labels with RH ranges in options", () => {
    const field = findSchemaField("carbonationExposureRow");

    if (field.kind !== "select") {
      throw new Error("carbonationExposureRow must be a select field");
    }

    expect(field.options.map((option) => option.label)).toEqual([
      "X0 — дуже сухий повітряно-вологісний режим (RH <= 30 %)",
      "XC1 — сухий режим (30 % < RH <= 60 %) або постійно вологонасичений стан",
      "XC2 — водонасичений стан при епізодичному висушуванні",
      "XC3 — помірний режим (60 % < RH <= 75 %) або епізодичне вологонасичення",
      "XC4 — поперемінне зволоження та висушування",
    ]);
  });

  it("defines explanatory inspector descriptions with exact normative references", () => {
    const allFields = CONCRETE_EXPOSURE_CLASS_INPUT_SCHEMA.groups.flatMap(
      (group) => group.fields,
    );

    for (const field of allFields) {
      expect(field.description, field.id).toBeTruthy();
      expect(field.description, field.id).not.toBe(field.name);
    }

    expect(findSchemaField("carbonationExposureRow").description).toMatch(
      /ДБН В\.2\.6-98:2009, таблиця 4\.1, рядки X0, XC1-XC4/,
    );
    expect(findSchemaField("xdExposureRow").description).toMatch(
      /ДБН В\.2\.6-98:2009, таблиця 4\.1, рядки XD1-XD3/,
    );
    expect(findSchemaField("xsExposureRow").description).toMatch(
      /XS1-XS3 не наведені як рядки таблиці 4\.1/,
    );
    expect(findSchemaField("xfExposureRow").description).toMatch(
      /ДБН В\.2\.6-98:2009, таблиця 4\.1, рядки XF1-XF4/,
    );
    expect(findSchemaField("xaExposureRow").description).toMatch(
      /ДБН В\.2\.6-98:2009, таблиця 4\.1, рядки XA1-XA3.*ДСТУ Б В\.2\.6-145/,
    );
  });
});

describe("getConcreteExposureClassInitialValues", () => {
  it("prefills shared fields from calculator 1 query parameters", () => {
    window.history.pushState(
      {},
      "",
      "/calculator/concrete-exposure-class?elementName=%D0%91%D0%B0%D0%BB%D0%BA%D0%B0%20%D0%91-1&elementType=beam&reinforcementPresence=reinforced_or_embedded_metal&currentExposureClass=XC1&returnTo=%2Fcalculator%2Fconcrete-cover-durability&returnField=exposureClass&returnLabel=%D0%A0%D0%BE%D0%B7%D1%80%D0%B0%D1%85%D1%83%D0%BD%D0%BE%D0%BA",
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
  it("renders result summary, formal report, and default return link", () => {
    render(<ConcreteExposureClassCalculator />);

    expect(
      screen.getByLabelText("Калькулятор класу впливу середовища для бетону"),
    ).toHaveClass("native-calculator");
    expect(screen.getByText("Повний набір класів: X0")).toBeInTheDocument();
    expect(screen.getByText("Для розрахунку захисного шару прийнято: X0")).toBeInTheDocument();
    expect(screen.getByText(/Дуже сухий повітряно-вологісний режим \(RH <= 30 %\)/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Покроковий звіт" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Нормативні посилання" })).toBeInTheDocument();
    expect(screen.getByText("таблиця 4.1 ДБН В.2.6-98:2009")).toBeInTheDocument();
    expect(screen.getByText("Рядки X0, XC1-XC4, XD1-XD3, XF1-XF4 та XA1-XA3 для визначення класів впливу середовища.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Завантажити DOCX" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Використати в розрахунку захисного шару" }),
    ).toHaveAttribute(
      "href",
      "/calculator/concrete-cover-durability?exposureClass=X0&sourceExposureClasses=X0&sourceCalculator=concrete-exposure-class",
    );
  });

  it("shows help buttons for visible inspector fields", () => {
    render(<ConcreteExposureClassCalculator />);

    for (const fieldName of [
      "Назва елемента",
      "Тип елемента",
      "Армування або металеві закладні",
      "Рядок X0/XC таблиці 4.1",
      "Рядок XD таблиці 4.1",
      "Клас XS за ДСТУ ENV/EN 206",
      "Рядок XF таблиці 4.1",
      "Рядок XA таблиці 4.1",
    ]) {
      expect(getHelpButton(fieldName), fieldName).toBeInTheDocument();
    }
  });

  it("selects formal table rows directly and reports governing class", async () => {
    const user = userEvent.setup();

    render(<ConcreteExposureClassCalculator />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Рядок X0/XC таблиці 4.1" }),
      "XC4",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Рядок XD таблиці 4.1" }),
      "XD3",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Клас XS за ДСТУ ENV/EN 206" }),
      "XS3",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Рядок XF таблиці 4.1" }),
      "XF4",
    );

    expect(screen.getByText("Повний набір класів: XC4, XD3, XS3, XF4")).toBeInTheDocument();
    expect(screen.getByText("Для розрахунку захисного шару прийнято: XD3")).toBeInTheDocument();
  });

  it("prefills from query params and returns to calculator 1", () => {
    window.history.pushState(
      {},
      "",
      "/calculator/concrete-exposure-class?elementName=%D0%91%D0%B0%D0%BB%D0%BA%D0%B0%20%D0%91-1&elementType=beam&reinforcementPresence=reinforced_or_embedded_metal&currentExposureClass=XC1&returnTo=%2Fcalculator%2Fconcrete-cover-durability&returnField=exposureClass&returnLabel=%D0%A0%D0%BE%D0%B7%D1%80%D0%B0%D1%85%D1%83%D0%BD%D0%BE%D0%BA",
    );

    render(<ConcreteExposureClassCalculator />);

    expect(screen.getByRole("textbox", { name: "Назва елемента" })).toHaveValue("Балка Б-1");
    expect(screen.getByRole("combobox", { name: "Тип елемента" })).toHaveValue("beam");
    expect(screen.getByText("Поточний клас у розрахунку захисного шару: XC1")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Повернути клас X0 у розрахунок захисного шару" }),
    ).toHaveAttribute(
      "href",
      "/calculator/concrete-cover-durability?exposureClass=X0&sourceExposureClasses=X0&sourceCalculator=concrete-exposure-class",
    );
  });

  it("shows XA classification warning after selecting unknown XA row", async () => {
    const user = userEvent.setup();

    render(<ConcreteExposureClassCalculator />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Рядок XA таблиці 4.1" }),
      "unknown_requires_classification",
    );

    expect(screen.getAllByText("Для визначення класу XA потрібна класифікація агресивності середовища за ДСТУ Б В.2.6-145.").length).toBeGreaterThan(0);
    const confirmationHelp = getHelpButton("Класифікацію агресивності підтверджено за ДСТУ Б В.2.6-145");

    expect(confirmationHelp).toBeInTheDocument();

    await user.click(confirmationHelp as HTMLButtonElement);

    expect(screen.getAllByText(/XA1-XA3.*ДСТУ Б В\.2\.6-145/).length).toBeGreaterThan(0);
    const report = screen.getByRole("region", { name: "Покроковий звіт" });
    expect(
      within(report).getByLabelText(
        "XA = потрібна класифікація агресивності середовища за ДСТУ Б В.2.6-145",
      ),
    ).toBeInTheDocument();
  });

  it("renders the XF formula with DBN table 4.1 wording", async () => {
    const user = userEvent.setup();

    render(<ConcreteExposureClassCalculator />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Рядок XF таблиці 4.1" }),
      "XF4",
    );

    const report = screen.getByRole("region", { name: "Покроковий звіт" });

    expect(
      within(report).getByLabelText(
        "XF = рядок таблиці 4.1: Водонасичений стан, застосовують антиобморожувачі. => XF4",
      ),
    ).toBeInTheDocument();
    expect(within(report).queryByLabelText(/freeze_thaw_risk|not_applicable/)).not.toBeInTheDocument();
  });

  it("builds a DOCX report from the rendered report steps", () => {
    const docxReport = buildConcreteExposureClassDocxReport({
      steps: [
        {
          key: "inputs",
          caption: "Вихідні дані:",
          items: ["Назва елемента: Елемент"],
          formula: "exposure_classes = f(...)",
        },
      ],
    });

    expect(docxReport.title).toBe("Покроковий звіт");
    expect(docxReport.fileBaseName).toMatch(/^klas-vplyvu-seredovyshcha-\d{4}-\d{2}-\d{2}$/);
    expect(docxReport.steps).toEqual([
      {
        key: "inputs",
        caption: "Вихідні дані:",
        items: ["Назва елемента: Елемент"],
        formula: "exposure_classes = f(...)",
      },
    ]);
  });
});
