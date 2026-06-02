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

  it("renders category-only navigation and a standards table for the active category", async () => {
    render(<CalculatorShell />);

    const rail = screen.getByRole("complementary", { name: "Каталог калькуляторів" });
    const workspace = screen.getByRole("main");

    expect(rail).toBeInTheDocument();
    expect(workspace).toBeInTheDocument();
    expect(within(rail).getByText("Іванейко Володимир")).toBeInTheDocument();
    expect(within(rail).getByText("Напрями розрахунків")).toBeInTheDocument();
    expect(within(rail).getByRole("link", { name: "Теплотехніка 14" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      within(rail).getByRole("link", { name: "FEM-розрахунки вузлів 6" }),
    ).toBeInTheDocument();
    expect(
      within(rail).queryByRole("link", {
        name: "Теплотехнічний розрахунок огороджувальної конструкції будівлі",
      }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "GitHub" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Про автора" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Про автора" })[0]).toHaveAttribute(
      "href",
      "/author",
    );
    expect(within(workspace).getByRole("heading", { name: "Теплотехніка" })).toBeInTheDocument();
    const table = within(workspace).getByRole("table", {
      name: "Розрахунки категорії Теплотехніка",
    });
    expect(within(table).getByRole("columnheader", { name: "Розрахунок" })).toBeInTheDocument();
    expect(
      within(table).queryByRole("columnheader", { name: "Що рахується" }),
    ).not.toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "Норматив" })).toBeInTheDocument();
    expect(
      within(table).queryByRole("columnheader", { name: "Застосування" }),
    ).not.toBeInTheDocument();
    expect(within(table).queryByRole("columnheader", { name: "Доступ" })).not.toBeInTheDocument();
    const externalEnvelopeRow = within(table).getByRole("row", {
      name: /Теплотехнічний розрахунок огороджувальної конструкції будівлі/,
    });
    expect(
      within(externalEnvelopeRow).getByRole("link", {
        name: /Теплотехнічний розрахунок огороджувальної конструкції будівлі/,
      }),
    ).toHaveAttribute("href", "/calculator/cadee-external");
    expect(
      within(externalEnvelopeRow).queryByText(
        "Комплексний розрахунок стіни/перекриття/покрівлі до зовнішнього середовища.",
      ),
    ).not.toBeInTheDocument();
    const detailsButton = within(externalEnvelopeRow).getByRole("button", {
      name: /Показати деталі.*Теплотехнічний розрахунок огороджувальної конструкції будівлі/,
    });
    expect(detailsButton).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(detailsButton);
    expect(detailsButton).toHaveAttribute("aria-expanded", "true");
    expect(
      within(externalEnvelopeRow).getByText(
        "Комплексний розрахунок стіни/перекриття/покрівлі до зовнішнього середовища.",
      ),
    ).toBeInTheDocument();
    expect(
      within(externalEnvelopeRow).getByRole("button", {
        name: /Згорнути деталі.*Теплотехнічний розрахунок огороджувальної конструкції будівлі/,
      }),
    ).toBeInTheDocument();
    expect(
      externalEnvelopeRow.querySelector(".calculator-table__standard-primary"),
    ).toHaveTextContent("ДСТУ 9191:2022");
    expect(
      externalEnvelopeRow.querySelectorAll(".calculator-table__standard-secondary"),
    ).toHaveLength(2);
    expect(externalEnvelopeRow).toHaveTextContent("ДБН В.2.6-31:2021");
    expect(externalEnvelopeRow).toHaveTextContent("ДСТУ-Н Б В.2.6-192:2013");
    expect(
      within(workspace).queryByText("Вбудований розрахунок"),
    ).not.toBeInTheDocument();
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

  it("switches the homepage table when a category is selected", async () => {
    const user = userEvent.setup();

    render(<CalculatorShell />);

    await user.click(screen.getByRole("link", { name: "Конструкції 8" }));

    expect(screen.getByRole("heading", { name: "Конструкції" })).toBeInTheDocument();
    const table = screen.getByRole("table", {
      name: "Розрахунки категорії Конструкції",
    });
    const minimumReinforcementRow = within(table).getByRole("row", {
      name: /Мінімальна площа армування залізобетонної балки або плити/,
    });
    expect(
      minimumReinforcementRow.querySelector(".calculator-table__standard-primary"),
    ).toHaveTextContent("ДСТУ Б В.2.6-156:2010");
    expect(
      minimumReinforcementRow.querySelector(".calculator-table__standard-secondary"),
    ).toHaveTextContent("Eurocode 2");
    expect(within(table).queryByRole("row", { name: /Опір теплопередачі/ })).not.toBeInTheDocument();
  });

  it("does not open the mobile drawer for direct category hash navigation", () => {
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: true }),
    });

    render(<CalculatorShell />);

    window.location.hash = "#konstruktsiyi";
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    expect(screen.getByRole("complementary", { name: "Каталог калькуляторів" })).toHaveAttribute(
      "data-mobile-open",
      "false",
    );

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
    });
  });

  it("keeps the left rail visible and renders an iframe for embedded calculators", () => {
    const calculator = getCalculatorBySlug("cadee-external");

    if (!calculator) {
      throw new Error("Expected test calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    const rail = screen.getByRole("complementary", { name: "Каталог калькуляторів" });

    expect(
      within(rail).getByRole("link", { name: "Теплотехніка 14" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(rail).queryByRole("link", {
        name: "Теплотехнічний розрахунок огороджувальної конструкції будівлі",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Теплотехнічний розрахунок огороджувальної конструкції будівлі",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Вбудований розрахунок").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByTitle("Теплотехнічний розрахунок огороджувальної конструкції будівлі"),
    ).toBeInTheDocument();
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
        name: "Сортамент арматури. Підбір діаметра та кількості арматурних стрижнів за площею",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Локальний/)).not.toBeInTheDocument();
    expect(screen.queryByTitle(calculator.title)).not.toBeInTheDocument();
    const calculatorRegion = screen.getByLabelText("Калькулятор підбору арматури");
    const useCases = screen.getByLabelText(
      "Сценарії: Сортамент арматури. Підбір діаметра та кількості арматурних стрижнів за площею",
    );
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
        name: "Характеристики арматури для розрахунку залізобетонних конструкцій",
      }),
    ).toBeInTheDocument();
    const relatedHeading = screen.getByRole("heading", { name: "Схожі калькулятори" });
    const relatedSection = relatedHeading.closest("section");
    expect(relatedSection).toHaveClass("workspace-section--related");
    expect(relatedSection?.querySelector(".calc-grid")).toHaveClass("calc-grid--compact");
    expect(relatedSection?.querySelector(".calc-card")).toHaveClass("calc-card--compact");
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
        name: "Характеристики бетону для розрахунку залізобетонних конструкцій",
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
        name: "Мінімальна площа армування залізобетонної балки або плити",
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
    expect(
      screen.getByText(
        "Рекомендований підбір на 1 м.п.: Ø12 крок 150 мм = 754 мм²/м.п. (111.1% від As,min).",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Підібрати діаметр і крок/ }),
    ).toBeInTheDocument();
  });

  it("renders the native foundation bar anchorage calculator with report links", () => {
    const calculator = getCalculatorBySlug("foundation-bar-anchorage");

    if (!calculator) {
      throw new Error("Expected native foundation anchorage calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Анкерування арматурного стрижня у залізобетонному фундаменті",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Калькулятор анкерування стрижня фундаменту"),
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /^Конструкція і матеріали/ })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /^Геометрія фундаменту/ })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /^Навантаження на уступі/ })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /^Анкерована арматура/ })).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Схема моделі сили розтягу фундаменту за рисунком 8.13" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/h бетонування, мм/)).toBeInTheDocument();
    expect(screen.getByText(/a від низу, мм/)).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /Ковзна опалубка - зменшує eta1 до 0.7/ }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "п. 7.2.2.2" }).some(
        (link) => link.getAttribute("href") === "#norm-dstu-7-2-2-2",
      ),
    ).toBe(true);
    expect(
      screen.getByRole("img", { name: "Фрагмент п. 8.8.2.5 ДСТУ Б В.2.6-156:2010, формула (8.13)" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Fs = R * ze / zi = 122.5 * 60 / 487.8 = 15.07 кН")).toBeInTheDocument();
    expect(screen.getByText(/Анкерування достатнє/)).toBeInTheDocument();

    const dstuLink = screen.getAllByRole("link", { name: "п. 8.8.2.5" })[0];
    expect(dstuLink).toHaveAttribute("href", "#norm-dstu-8-8-2-5");

    expect(screen.getByRole("tab", { name: "Нормативні пункти" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "п. 8.8.2.5 ДСТУ Б В.2.6-156:2010, формула (8.13)",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Сила розтягу для анкерування визначається як Fs = R \* ze \/ zi/).length,
    ).toBeGreaterThan(0);
  });

  it("renders the native cassoon load distribution calculator with a step report", async () => {
    const user = userEvent.setup();
    const calculator = getCalculatorBySlug("cassoon-load-distribution");

    if (!calculator) {
      throw new Error("Expected native cassoon load distribution calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Розподіл навантаження в кесонному перекритті",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Калькулятор коефіцієнтів c1 і c2 для розподілу навантаження"),
    ).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "lk" })).toHaveValue(3);
    expect(screen.getByRole("spinbutton", { name: "ld" })).toHaveValue(6);
    expect(screen.getByRole("spinbutton", { name: "q" })).toHaveValue(10);
    expect(screen.queryByRole("spinbutton", { name: "lk, м" })).not.toBeInTheDocument();
    expect(screen.queryByRole("spinbutton", { name: "ld, м" })).not.toBeInTheDocument();
    expect(screen.queryByRole("spinbutton", { name: "q, кН/м²" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Одиниця lk" })).toHaveValue("m");
    expect(screen.getByRole("combobox", { name: "Одиниця ld" })).toHaveValue("m");
    expect(screen.getByRole("combobox", { name: "Одиниця q" })).toHaveValue("kn-m2");
    expect(screen.getByRole("spinbutton", { name: "q" }).closest("label")).toContainElement(
      screen.getByRole("combobox", { name: "Одиниця q" }),
    );
    expect(
      screen.getByRole("img", {
        name: "Книжкова схема розподілу навантаження q між напрямами lk і ld за рисунком VII.40",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        "qk = c1 * q = 0.9412 * 10 = 9.41 кН/м²; qd = c2 * q = 0.0588 * 10 = 0.59 кН/м²",
      ),
    ).toBeInTheDocument();
    const coefficientsEquation = screen.getByLabelText(
      "c1 = ld^4 / (lk^4 + ld^4) = 6^4 / (3^4 + 6^4) = 0.9412; c2 = lk^4 / (lk^4 + ld^4) = 3^4 / (3^4 + 6^4) = 0.0588",
    );
    expect(
      coefficientsEquation.querySelectorAll(".cassoon-load-equation__line"),
    ).toHaveLength(2);
    expect(
      screen.getAllByText((_, element) =>
        Boolean(
          element?.textContent?.includes(
            "навантаження q розкладається між двома взаємно перпендикулярними напрямами",
          ),
        ),
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", {
        name: "Линович Л.Е. Расчет и конструирование частей гражданских зданий. Изд. 8-е, перераб. и доп. К.: Будівельник, 1972. 664 с.",
      }),
    ).toHaveAttribute("href", "https://koha.tntu.edu.ua/bib/134803");

    await user.clear(screen.getByRole("spinbutton", { name: "ld" }));
    await user.type(screen.getByRole("spinbutton", { name: "ld" }), "6.3");

    expect(
      screen.getByText(/ld\/lk більше 2: за приміткою Ліновіча/),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("ld/lk = 2.1 > 2, тому приймаємо c1 = 1; c2 = 0"),
    ).toBeInTheDocument();
  });

  it("updates cassoon load units and normalizes reversed spans", async () => {
    const user = userEvent.setup();
    const calculator = getCalculatorBySlug("cassoon-load-distribution");

    if (!calculator) {
      throw new Error("Expected native cassoon load distribution calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Одиниця q" }), "n-m2");
    await user.selectOptions(screen.getByRole("combobox", { name: "Одиниця lk" }), "cm");
    await user.selectOptions(screen.getByRole("combobox", { name: "Одиниця ld" }), "mm");

    expect(screen.getByRole("spinbutton", { name: "q" })).toHaveValue(10);
    expect(screen.queryByRole("spinbutton", { name: "q, Н/м²" })).not.toBeInTheDocument();

    await user.clear(screen.getByRole("spinbutton", { name: "q" }));
    await user.type(screen.getByRole("spinbutton", { name: "q" }), "10000");
    await user.clear(screen.getByRole("spinbutton", { name: "lk" }));
    await user.type(screen.getByRole("spinbutton", { name: "lk" }), "600");
    await user.clear(screen.getByRole("spinbutton", { name: "ld" }));
    await user.type(screen.getByRole("spinbutton", { name: "ld" }), "3000");

    expect(screen.queryByText("ld має бути не менше lk.")).not.toBeInTheDocument();
    expect(
      screen.getAllByText((_, element) =>
        Boolean(element?.textContent?.includes("прийнято lk = 3 м; ld = 6 м")),
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText((_, element) =>
        Boolean(element?.textContent?.includes("введено l1 = 600 см")),
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText((_, element) =>
        Boolean(element?.textContent?.includes("введено l2 = 3000 мм")),
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByLabelText(
        "qk = c1 * q = 0.9412 * 10000 = 9411.76 Н/м²; qd = c2 * q = 0.0588 * 10000 = 588.24 Н/м²",
      ),
    ).toBeInTheDocument();
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
