import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { CalculatorShell } from "@/components/calculator-shell";
import { getCalculatorBySlug } from "@/lib/calculators";

function expectMathSubscript(element: HTMLElement, base: string, subscript: string) {
  expect(element.querySelector(".math-notation__base")).toHaveTextContent(base);
  expect(element.querySelector(".math-notation sub")).toHaveTextContent(subscript);
}

function getSummaryText(text: string) {
  return screen.getByText((_, element) => {
    return element?.tagName.toLowerCase() === "p" && element.textContent?.includes(text);
  });
}

describe("CalculatorShell", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the engineering shell with a left catalog rail on the homepage", () => {
    render(<CalculatorShell />);

    const rail = screen.getByRole("complementary", { name: "Каталог калькуляторів" });
    const workspace = screen.getByRole("main");

    expect(rail).toBeInTheDocument();
    expect(workspace).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Інженерні розрахунки для проектування",
      }),
    ).toBeInTheDocument();
    expect(within(rail).getByText("Іванейко Володимир")).toBeInTheDocument();
    expect(within(rail).getByText("Напрями розрахунків")).toBeInTheDocument();
    expect(within(rail).getByRole("button", { name: "Теплотехніка" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(
      within(rail).queryByRole("link", { name: "Огороджувальна конструкція" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "GitHub" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Про автора" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Про автора" })[0]).toHaveAttribute(
      "href",
      "/author",
    );
    expect(
      within(workspace).getAllByRole("link", { name: "Огороджувальна конструкція" }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      within(workspace).getAllByText("Вбудований розрахунок").length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      within(workspace).getByRole("link", { name: "Про автора" }),
    ).toHaveAttribute("href", "/author");
    expect(
      screen.queryByRole("heading", { name: "Інженерні продукти та напрями" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toHaveTextContent(
      "Платформа виросла з практики проектування, нормативної роботи та прикладних цифрових сервісів.",
    );
  });

  it("keeps the left rail visible and renders an iframe for embedded calculators", () => {
    const calculator = getCalculatorBySlug("cadee-external");

    if (!calculator) {
      throw new Error("Expected test calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    const rail = screen.getByRole("complementary", { name: "Каталог калькуляторів" });

    expect(
      within(rail).getByRole("link", { name: "Огороджувальна конструкція" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("heading", { level: 2, name: "Огороджувальна конструкція" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Вбудований розрахунок").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTitle("Огороджувальна конструкція")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Відкрити окремо/ })[0],
    ).toHaveAttribute("href", calculator.openUrl);
  });

  it("renders the native rebar area calculator without an iframe", () => {
    const calculator = getCalculatorBySlug("rebar-area-bars");

    if (!calculator) {
      throw new Error("Expected native rebar calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Сортамент арматури",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Локальний/)).not.toBeInTheDocument();
    expect(screen.queryByTitle(calculator.title)).not.toBeInTheDocument();
    const calculatorRegion = screen.getByLabelText("Калькулятор підбору арматури");
    const useCases = screen.getByLabelText("Сценарії: Сортамент арматури");
    expect(
      calculatorRegion.compareDocumentPosition(useCases) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByRole("spinbutton", { name: "Мінімальна площа, см²" })).toHaveValue(5);
    expect(
      screen.queryByRole("spinbutton", { name: "Максимальна площа арматури" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "мм²" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "см²" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "м²" })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "n" })).toHaveValue(10);
    expect(screen.getByRole("spinbutton", { name: "n" })).not.toHaveAttribute("max");
    expect(screen.getByRole("spinbutton", { name: "s, мм" })).toHaveValue(400);
    const barsTable = screen.getByRole("table", {
      name: "Площа арматури для діаметра стержня та кількості стержнів, см²",
    });
    expect(barsTable.closest(".rebar-table-wrap")).toHaveAttribute(
      "data-table-kind",
      "bars",
    );
    const countHeader = within(barsTable).getByRole("columnheader", { name: "n = 10" });
    expect(countHeader).toBeInTheDocument();
    expect(countHeader.querySelector(".math-notation__base")).toHaveTextContent("n");
    expect(within(barsTable).getByRole("cell", { name: /5\.027 100\.5%/ })).toHaveAttribute(
      "data-best-match",
      "true",
    );
    expect(within(barsTable).getByRole("cell", { name: /5\.027 100\.5%/ })).toHaveAttribute(
      "data-in-range",
      "true",
    );
    const diameter10Row = within(barsTable).getByRole("row", { name: /ø10/ });
    expect(within(diameter10Row).getByRole("cell", { name: /6\.283 125\.7%/ })).toHaveAttribute(
      "data-in-range",
      "true",
    );
    expect(within(diameter10Row).getByRole("cell", { name: "7.069" })).not.toHaveAttribute(
      "data-in-range",
    );
    const meterTable = screen.getByRole("table", {
      name: "Площа арматури на 1 м.п. за діаметром і кроком стержнів, см²/м.п.",
    });
    expect(meterTable).toBeInTheDocument();
    expect(meterTable.closest(".rebar-table-wrap")).toHaveAttribute(
      "data-table-kind",
      "meter",
    );
    expect(
      within(meterTable).getByRole("columnheader", { name: "s = 400 мм" }),
    ).toBeInTheDocument();
    expect(
      within(meterTable)
        .getByRole("columnheader", { name: "s = 400 мм" })
        .querySelector(".math-notation__base"),
    ).toHaveTextContent("s");
    const meterBestCells = within(meterTable).getAllByRole("cell", {
      name: /5\.027 100\.5%/,
    });
    expect(
      meterBestCells.some(
        (cell) =>
          cell.getAttribute("data-best-match") === "true" &&
          cell.getAttribute("data-in-range") === "true",
      ),
    ).toBe(true);
  });

  it("updates the native rebar area label when units change", async () => {
    const user = userEvent.setup();
    const calculator = getCalculatorBySlug("rebar-area-bars");

    if (!calculator) {
      throw new Error("Expected native rebar calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    await user.click(screen.getByRole("radio", { name: "мм²" }));

    expect(screen.getByRole("spinbutton", { name: "Мінімальна площа, мм²" })).toHaveValue(5);
  });

  it("updates the native rebar table when custom n changes above the old upper limit", async () => {
    const user = userEvent.setup();
    const calculator = getCalculatorBySlug("rebar-area-bars");

    if (!calculator) {
      throw new Error("Expected native rebar calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    const customCount = screen.getByRole("spinbutton", { name: "n" });

    await user.clear(customCount);
    await user.type(customCount, "120");
    await user.tab();

    const barsTable = screen.getByRole("table", {
      name: "Площа арматури для діаметра стержня та кількості стержнів, см²",
    });
    expect(within(barsTable).getByRole("columnheader", { name: "n = 120" })).toBeInTheDocument();
    const diameter8Row = within(barsTable).getByRole("row", { name: /ø8/ });
    expect(within(diameter8Row).getByRole("cell", { name: "60.319" })).not.toHaveAttribute(
      "data-in-range",
    );
  });

  it("updates the one-meter table when custom spacing changes", async () => {
    const user = userEvent.setup();
    const calculator = getCalculatorBySlug("rebar-area-bars");

    if (!calculator) {
      throw new Error("Expected native rebar calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    const customSpacing = screen.getByRole("spinbutton", { name: "s, мм" });

    await user.clear(customSpacing);
    await user.type(customSpacing, "350");
    await user.tab();

    const meterTable = screen.getByRole("table", {
      name: "Площа арматури на 1 м.п. за діаметром і кроком стержнів, см²/м.п.",
    });

    expect(
      within(meterTable).getByRole("columnheader", { name: "s = 350 мм" }),
    ).toBeInTheDocument();
    const diameter10Row = within(meterTable).getByRole("row", { name: /ø10/ });
    expect(within(diameter10Row).getByRole("cell", { name: "2.244" })).not.toHaveAttribute(
      "data-in-range",
    );
  });

  it("renders the native rebar characteristics calculator without an iframe", async () => {
    const user = userEvent.setup();
    const calculator = getCalculatorBySlug("rebar-characteristics");

    if (!calculator) {
      throw new Error("Expected native rebar characteristics calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Арматура",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByTitle(calculator.title)).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Клас арматури" })).toHaveValue(
      "A500C",
    );
    expect(getSummaryText("A500C: fyk = 500 МПа")).toBeInTheDocument();

    const table = screen.getByRole("table", {
      name: "Характеристики арматури за ДСТУ 3760:2006",
    });

    expect(
      within(table).getByRole("columnheader", { name: "Характеристика" }),
    ).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "A500C" })).toHaveAttribute(
      "data-selected",
      "true",
    );
    expect(within(table).getByRole("columnheader", { name: "A1000" })).toBeInTheDocument();
    const fykRow = within(table).getByRole("row", { name: /fyk, МПа/ });
    expect(fykRow).toBeInTheDocument();
    expectMathSubscript(fykRow, "f", "yk");
    expect(within(table).getByRole("row", { name: /fyd, МПа/ })).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Клас арматури" }),
      "A400C",
    );

    expect(getSummaryText("A400C: fyk = 400 МПа")).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "A400C" })).toHaveAttribute(
      "data-selected",
      "true",
    );
  });

  it("renders the native concrete characteristics calculator without an iframe", async () => {
    const user = userEvent.setup();
    const calculator = getCalculatorBySlug("concrete-characteristics");

    if (!calculator) {
      throw new Error("Expected native concrete calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Бетон",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByTitle(calculator.title)).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Клас бетону" })).toHaveValue(
      "C30/37",
    );
    expect(getSummaryText("C30/37: fck = 30 МПа")).toBeInTheDocument();

    const table = screen.getByRole("table", {
      name: "Характеристики бетону за ДБН В.2.6-98:2009 та ДСТУ Б В.2.6-156:2010",
    });

    expect(
      within(table).getByRole("columnheader", { name: "Характеристика" }),
    ).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "C90/105" })).toBeInTheDocument();
    const fckRow = within(table).getByRole("row", { name: /fck, МПа/ });
    expect(fckRow).toBeInTheDocument();
    expectMathSubscript(fckRow, "f", "ck");
    const ecmRow = within(table).getByRole("row", { name: /Ecm, ГПа/ });
    expect(ecmRow).toBeInTheDocument();
    expectMathSubscript(ecmRow, "E", "cm");
    const epsilonCu3Row = within(table).getByRole("row", { name: /εcu3, ‰/ });
    expect(epsilonCu3Row).toBeInTheDocument();
    expectMathSubscript(epsilonCu3Row, "ε", "cu3");
    expect(within(table).getByRole("columnheader", { name: "C30/37" })).toHaveAttribute(
      "data-selected",
      "true",
    );

    await user.selectOptions(screen.getByRole("combobox", { name: "Клас бетону" }), "C40/50");

    expect(getSummaryText("C40/50: fck = 40 МПа")).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "C40/50" })).toHaveAttribute(
      "data-selected",
      "true",
    );
  });

  it("renders the native minimum reinforcement calculator with a step report", async () => {
    const user = userEvent.setup();
    const calculator = getCalculatorBySlug("minimum-reinforcement-area");

    if (!calculator) {
      throw new Error("Expected native minimum reinforcement calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Мінімальна площа армування",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Калькулятор мінімальної площі армування"),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Тип конструкції" })).toHaveValue(
      "beam",
    );
    expect(screen.getByRole("combobox", { name: "Клас бетону" })).toHaveValue(
      "C30/37",
    );
    expect(screen.getByRole("combobox", { name: "Клас арматури" })).toHaveValue(
      "A500C",
    );
    expect(
      screen.getByLabelText(
        "As,min,2 = 0.0013 * bt * d = 0.0013 * 1000 * 450 = 585 мм² = 5.85 см²",
      ),
    ).toBeInTheDocument();
    expect(document.querySelectorAll(".minimum-reinforcement-formula")).toHaveLength(0);
    expect(document.querySelectorAll(".minimum-reinforcement-check")).toHaveLength(0);
    expect(screen.getByLabelText("400 <= 500 <= 600 - умова виконується")).toHaveClass(
      "minimum-reinforcement-equation",
    );
    expect(
      screen.getByRole("img", { name: "Позначення величин для балки" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Позначення величин для плити" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Підібрати діаметр і кількість/ }),
    ).toHaveAttribute(
      "href",
      "/calculator/rebar-area-bars?minimumArea=678.6&unit=mm2&returnTo=%2Fcalculator%2Fminimum-reinforcement-area&returnLabel=%D0%9F%D0%BE%D0%B2%D0%B5%D1%80%D0%BD%D1%83%D1%82%D0%B8%D1%81%D1%8F%20%D0%B4%D0%BE%20As%2Cmin",
    );
    expect(
      screen.getByText(
        "Рекомендований підбір: 9Ø10 = 706.9 мм² (104.2% від As,min).",
      ),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Тип конструкції" }),
      "slab",
    );

    expect(screen.getByLabelText("bt = 1000 мм")).toBeInTheDocument();
  });

  it("prefills the rebar selection calculator from query parameters", async () => {
    window.history.pushState(
      {},
      "",
      "/calculator/rebar-area-bars?minimumArea=678.6&unit=mm2&returnTo=%2Fcalculator%2Fminimum-reinforcement-area&returnLabel=%D0%9F%D0%BE%D0%B2%D0%B5%D1%80%D0%BD%D1%83%D1%82%D0%B8%D1%81%D1%8F%20%D0%B4%D0%BE%20As%2Cmin",
    );
    const calculator = getCalculatorBySlug("rebar-area-bars");

    if (!calculator) {
      throw new Error("Expected native rebar calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    expect(
      await screen.findByRole("spinbutton", { name: "Мінімальна площа, мм²" }),
    ).toHaveValue(678.6);
    expect(screen.getByRole("radio", { name: "мм²" })).toBeChecked();
    expect(screen.getByRole("link", { name: "Повернутися до As,min" })).toHaveAttribute(
      "href",
      "/calculator/minimum-reinforcement-area",
    );
  });
});
