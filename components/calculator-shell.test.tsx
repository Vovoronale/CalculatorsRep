import React from "react";
import { readFileSync } from "node:fs";
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

function getNumericAttribute(element: Element, name: string): number {
  const value = element.getAttribute(name);

  if (value === null) {
    throw new Error(`Missing SVG attribute ${name}`);
  }

  return Number.parseFloat(value);
}

describe("CalculatorShell", () => {
  afterEach(() => {
    cleanup();
    window.history.replaceState(null, "", "/");
  });

  it("renders category-only navigation and a standards table for the active category", async () => {
    render(<CalculatorShell />);

    const rail = screen.getByRole("complementary", { name: "Каталог калькуляторів" });
    const workspace = screen.getByRole("main");

    expect(rail).toBeInTheDocument();
    expect(workspace).toBeInTheDocument();
    expect(within(rail).getByText("Калькулятори")).toBeInTheDocument();
    expect(within(rail).getByText("Напрями розрахунків")).toBeInTheDocument();
    expect(
      within(rail).getByRole("link", { name: "Теплотехніка 20" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(rail).getByRole("link", { name: "Теплові містки / FEM 6" }),
    ).toBeInTheDocument();
    expect(within(rail).queryByRole("link", { name: "Арматура 2" })).not.toBeInTheDocument();
    expect(
      within(rail).getByRole("button", { name: "Розгорнути Конструкції" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      within(rail).queryByRole("link", {
        name: "Теплотехнічний розрахунок огороджувальної конструкції будівлі",
      }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "GitHub" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Про автора" })).toHaveLength(3);
    expect(screen.getAllByRole("link", { name: "Про автора" })[0]).toHaveAttribute(
      "href",
      "/author",
    );
    expect(screen.getByRole("link", { name: "Конфіденційність" })).toHaveAttribute(
      "href",
      "/privacy",
    );
    expect(
      within(workspace).getByRole("heading", {
        name: "Теплотехніка",
      }),
    ).toBeInTheDocument();
    const table = within(workspace).getByRole("table", {
      name: "Розрахунки категорії Теплотехніка",
    });
    expect(within(table).getByRole("columnheader", { name: "№" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "Іконка" })).toBeInTheDocument();
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
      externalEnvelopeRow.querySelector(".calculator-table__number"),
    ).toHaveTextContent("01");
    const calculatorImage = within(externalEnvelopeRow).getByRole("img", {
      name: "Іконка: Теплотехнічний розрахунок огороджувальної конструкції будівлі",
    });
    expect(calculatorImage).toHaveAttribute(
      "src",
      "/calculator-icons/cadee-external.svg",
    );
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
    expect(within(table).getByRole("row", { name: /Розрахунок коефіцієнтів теплопровідного включення вузла стику однорідної стіни та перекриття/ })).toBeInTheDocument();
    expect(
      within(workspace).queryByText("Вбудований розрахунок"),
    ).not.toBeInTheDocument();
    expect(
      within(workspace)
        .getAllByRole("link", { name: "Про автора" })
        .some((link) => link.getAttribute("href") === "/author"),
    ).toBe(true);
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

    await user.click(screen.getByRole("button", { name: "Розгорнути Конструкції" }));
    await user.click(screen.getByRole("link", { name: "Конструкції 13" }));

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

  it("collapses inactive category groups and toggles them from the rail", async () => {
    const user = userEvent.setup();

    render(<CalculatorShell selectedCategory="inzhenerni-merezhi" />);

    const rail = screen.getByRole("complementary", { name: "Каталог калькуляторів" });
    const engineeringToggle = within(rail).getByRole("button", {
      name: "Згорнути Інженерні мережі",
    });
    const cadToggle = within(rail).getByRole("button", {
      name: "Розгорнути CAD / GIS / Дані",
    });

    expect(engineeringToggle).toHaveAttribute("aria-expanded", "true");
    expect(within(rail).getByRole("link", { name: "Електрика 1" })).toBeInTheDocument();
    expect(cadToggle).toHaveAttribute("aria-expanded", "false");
    expect(within(rail).queryByRole("link", { name: "DXF / GeoJSON 1" })).not.toBeInTheDocument();

    await user.click(cadToggle);

    expect(cadToggle).toHaveAttribute("aria-expanded", "true");
    expect(within(rail).getByRole("link", { name: "DXF / GeoJSON 1" })).toBeInTheDocument();
    expect(within(rail).queryByRole("link", { name: "Конвертери 0" })).not.toBeInTheDocument();
    expect(within(rail).getByRole("link", { name: "DXF / GeoJSON 1" })).toHaveAttribute(
      "data-count-state",
      "filled",
    );

    await user.click(cadToggle);

    expect(cadToggle).toHaveAttribute("aria-expanded", "false");
    expect(within(rail).queryByRole("link", { name: "DXF / GeoJSON 1" })).not.toBeInTheDocument();
  });

  it("switches the homepage table to leaf-only calculators when a subcategory is selected", async () => {
    const user = userEvent.setup();

    render(<CalculatorShell />);

    await user.click(screen.getByRole("link", { name: "Підлоги 5" }));

    expect(screen.getByRole("heading", { name: "Підлоги" })).toBeInTheDocument();
    const table = screen.getByRole("table", {
      name: "Розрахунки категорії Підлоги",
    });

    expect(within(table).getByRole("row", { name: /Теплопередача підлоги по ґрунту/ })).toBeInTheDocument();
    expect(
      within(table).queryByRole("row", {
        name: /Опір теплопередачі огороджувальної конструкції/,
      }),
    ).not.toBeInTheDocument();
    expect(
      within(table).queryByRole("row", {
        name: /Розрахунок коефіцієнтів теплопровідного включення/,
      }),
    ).not.toBeInTheDocument();
  });

  it("does not open the mobile drawer for direct category hash navigation", () => {
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: true }),
    });

    render(<CalculatorShell />);

    window.location.hash = "#zalizobeton";
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
      within(rail).getByRole("link", { name: "Теплотехніка 20" }),
    ).not.toHaveAttribute("aria-current");
    expect(
      within(rail).getByRole("link", { name: "Огороджувальні конструкції 9" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(rail).queryByRole("link", {
        name: "Теплотехнічний розрахунок огороджувальної конструкції будівлі",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
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
    expect(screen.getByRole("link", { name: "Каталог" })).toHaveAttribute("href", "/");
    expect(
      screen.getByRole("link", { name: "Теплотехніка" }),
    ).toHaveAttribute("href", "/#energoefektyvnist-teplotekhnika");
    expect(
      screen.getByRole("link", { name: "Огороджувальні конструкції" }),
    ).toHaveAttribute("href", "/#ogorodzhuvalni-konstruktsiyi");
  });

  it("renders calculator detail pages with a single H1 and SEO methodology sections", () => {
    const calculator = getCalculatorBySlug("soil-design-resistance");

    if (!calculator) {
      throw new Error("Expected native soil design resistance calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    const pageHeadings = [...document.querySelectorAll("h1")];

    expect(pageHeadings).toHaveLength(1);
    expect(pageHeadings[0]).toHaveTextContent("Розрахунковий опір ґрунту основи");

    const seoSection = screen.getByRole("region", {
      name: "Методика та нормативний контекст",
    });

    expect(
      within(seoSection).getByRole("heading", {
        level: 2,
        name: "Методика та нормативний контекст",
      }),
    ).toBeInTheDocument();
    expect(
      within(seoSection).getByRole("heading", {
        level: 3,
        name: "Короткий опис задачі",
      }),
    ).toBeInTheDocument();
    expect(
      within(seoSection).getByRole("heading", {
        level: 3,
        name: "Формули та методика",
      }),
    ).toBeInTheDocument();
    expect(
      within(seoSection).getByRole("heading", {
        level: 3,
        name: "Приклад розрахунку",
      }),
    ).toBeInTheDocument();
    expect(
      within(seoSection).getByRole("heading", {
        level: 3,
        name: "Нормативна база",
      }),
    ).toBeInTheDocument();
    expect(seoSection).toHaveTextContent("ДБН В.2.1-10-2009, додаток Е");
  });

  it("renders the native rebar area calculator without an iframe", () => {
    const calculator = getCalculatorBySlug("rebar-area-bars");

    if (!calculator) {
      throw new Error("Expected native rebar calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
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
        level: 1,
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
        level: 1,
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
        level: 1,
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
      "native-report__formula",
    );
    const initialSectionDiagram = screen.getByRole("img", {
      name: "Параметричний залізобетонний переріз bt 1000 мм, h 500 мм",
    });

    expect(initialSectionDiagram).toBeInTheDocument();
    expect(initialSectionDiagram.textContent).toContain("As,min = 678.6 мм²");
    expect(initialSectionDiagram.textContent).toContain("1000");
    expect(initialSectionDiagram.textContent).toContain("500");
    expect(initialSectionDiagram.textContent).toContain("16");
    expect(initialSectionDiagram.textContent).not.toContain("A's");
    expect(
      initialSectionDiagram.querySelectorAll('rect[fill="url(#section_body-hatch)"]'),
    ).toHaveLength(1);
    expect(initialSectionDiagram.querySelectorAll('rect[fill="#d8c4ff"]')).toHaveLength(
      1,
    );
    expect(
      screen.queryByRole("img", { name: "Позначення величин для балки" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Позначення величин для плити" }),
    ).not.toBeInTheDocument();
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

    expect(
      screen.getByRole("img", {
        name: "Параметричний залізобетонний переріз bt 1000 мм, h 500 мм",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Рекомендований підбір на 1 м.п.: Ø12 крок 150 мм = 754 мм²/м.п. (111.1% від As,min).",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Підібрати діаметр і крок/ }),
    ).toBeInTheDocument();

    await user.clear(screen.getByRole("textbox", { name: "Висота перерізу" }));
    await user.type(screen.getByRole("textbox", { name: "Висота перерізу" }), "300");
    await user.clear(screen.getByRole("textbox", { name: "Ширина розтягнутої зони" }));
    await user.type(
      screen.getByRole("textbox", { name: "Ширина розтягнутої зони" }),
      "1200",
    );

    const updatedSectionDiagram = screen.getByRole("img", {
      name: "Параметричний залізобетонний переріз bt 1200 мм, h 300 мм",
    });

    expect(updatedSectionDiagram).toBeInTheDocument();
    expect(updatedSectionDiagram.textContent).toContain("1200");
    expect(updatedSectionDiagram.textContent).toContain("300");
    expect(updatedSectionDiagram.textContent).toContain("As,min = 452.4 мм²");
  });

  it("renders the native foundation bar anchorage calculator with report links", () => {
    const calculator = getCalculatorBySlug("foundation-bar-anchorage");

    if (!calculator) {
      throw new Error("Expected native foundation anchorage calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Анкерування арматурного стрижня у залізобетонному фундаменті",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Калькулятор анкерування арматури фундаменту"),
    ).toHaveClass("native-calculator");
    expect(screen.getByRole("group", { name: /^Конструкція і матеріали/ })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /^Геометрія фундаменту/ })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /^Навантаження на уступі/ })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /^Анкерована арматура/ })).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Схема моделі сили розтягу фундаменту за рисунком 8.13" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Висота бетонування")).toBeInTheDocument();
    expect(screen.getByText("Вісь стрижня від низу")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Ковзна опалубка" }),
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

    expect(screen.getByRole("link", { name: "Норми" })).toHaveAttribute(
      "href",
      "#foundation-anchorage-norms",
    );
    expect(
      screen.getByRole("heading", {
        name: "п. 8.8.2.5 ДСТУ Б В.2.6-156:2010, формула (8.13)",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Сила розтягу для анкерування визначається як Fs = R \* ze \/ zi/).length,
    ).toBeGreaterThan(0);
  });

  it.each([
    [
      "cassoon-load-distribution",
      "Калькулятор коефіцієнтів c1 і c2 для розподілу навантаження",
      "Позначення величин",
    ],
    [
      "foundation-base-pressure",
      "Калькулятор напружень під підошвою фундаменту",
      "Епюра тиску під підошвою",
    ],
    ["minimum-reinforcement-area", "Калькулятор мінімальної площі армування", "Позначення величин"],
    ["foundation-bar-anchorage", "Калькулятор анкерування арматури фундаменту", "Позначення величин"],
  ])("renders %s with the shared report calculator shell", (slug, ariaLabel, diagramHeading) => {
    const calculator = getCalculatorBySlug(slug);
    if (!calculator) throw new Error(`Expected ${slug} to exist`);

    render(<CalculatorShell selectedCalculator={calculator} />);

    expect(screen.getByLabelText(ariaLabel)).toHaveClass("native-calculator");
    expect(screen.getByRole("heading", { name: diagramHeading })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Покроковий звіт" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Завантажити DOCX" })).toBeInTheDocument();
  });

  it("renders the steel structure category/group native calculator", () => {
    const calculator = getCalculatorBySlug("steel-structure-category-group");
    if (!calculator) throw new Error("Expected steel-structure-category-group to exist");

    render(<CalculatorShell selectedCalculator={calculator} />);

    expect(
      screen.getByLabelText("Калькулятор категорій і груп сталевих конструкцій"),
    ).toHaveClass("native-calculator");
    expect(screen.getByRole("heading", { name: "Покроковий звіт" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Завантажити DOCX" })).toBeInTheDocument();
  });

  it("renders the residential yard areas native calculator", () => {
    const calculator = getCalculatorBySlug("residential-yard-areas");
    if (!calculator) throw new Error("Expected residential-yard-areas to exist");

    render(<CalculatorShell selectedCalculator={calculator} />);

    expect(
      screen.getByLabelText("Калькулятор площ прибудинкових майданчиків"),
    ).toHaveClass("native-calculator");
    expect(
      within(
        screen.getByLabelText("Результати розрахунку площ майданчиків"),
      ).getByText("Sприбуд = 457,2 м²"),
    ).toBeInTheDocument();
  });

  it("renders the native soil design resistance calculator with a DBN report", async () => {
    const user = userEvent.setup();
    const calculator = getCalculatorBySlug("soil-design-resistance");

    if (!calculator) {
      throw new Error("Expected native soil design resistance calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Розрахунковий опір ґрунту основи",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Калькулятор розрахункового опору ґрунту основи"),
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Умови роботи" })).toHaveClass(
      "input-schema-group",
    );
    expect(screen.getByRole("combobox", { name: "Спосіб розрахунку" })).toHaveValue(
      "manual-e7",
    );
    expect(screen.getByText("Коефіцієнт умов роботи 1")).toBeInTheDocument();
    expect(screen.getByText("Коефіцієнт умов роботи 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Позначення γc1")).toBeInTheDocument();
    expect(screen.getByLabelText("Позначення γc2")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Коефіцієнт умов роботи 1" })).toHaveValue("1");
    expect(screen.getByRole("textbox", { name: "Коефіцієнт умов роботи 2" })).toHaveValue("1");
    expect(screen.queryByRole("combobox", { name: "Тип ґрунту" })).not.toBeInTheDocument();
    expect(getSummaryText("R = 162.82 кПа = 16.3 т/м² = 1.6 кг/см²")).toBeInTheDocument();
    const rFormula = screen.getByLabelText(
      "R = γc1 * γc2 / k * [Mγ * kz * b * γ11 + Mq * d1 * γ′11 + (Mq - 1) * db * γ′11 + Mc * c11] = 1 * 1 / 1 * [1.15 * 1 * 1 * 17.1 + 5.59 * 1.2 * 16.6 + (5.59 - 1) * 0 * 16.6 + 7.95 * 4] = 162.82 кПа",
    );
    expect(rFormula).toBeInTheDocument();
    expect(rFormula.querySelector(".katex")).toBeInTheDocument();
    expect(rFormula).toHaveClass("soil-resistance-equation");
    expect(rFormula).toHaveAttribute(
      "title",
      "R = γc1 * γc2 / k * [Mγ * kz * b * γ11 + Mq * d1 * γ′11 + (Mq - 1) * db * γ′11 + Mc * c11] = 1 * 1 / 1 * [1.15 * 1 * 1 * 17.1 + 5.59 * 1.2 * 16.6 + (5.59 - 1) * 0 * 16.6 + 7.95 * 4] = 162.82 кПа",
    );
    expect(screen.getByRole("button", { name: "Завантажити DOCX" })).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "формула (Е.1)" }).some(
        (link) => link.getAttribute("href") === "#soil-norm-e1",
      ),
    ).toBe(true);
    expect(
      screen.getByRole("img", {
        name: "Скан п. Е.4 і формули Е.1 з ДБН В.2.1-10-2009",
      }),
    ).toHaveAttribute("src", "/dbn/soil-design-resistance/dbn-e4-e1.png");
    expect(
      screen.getByRole("img", {
        name: "Скан формули Е.1 з ДБН В.2.1-10-2009",
      }),
    ).toHaveAttribute("src", "/dbn/soil-design-resistance/dbn-e4-e1.png");
    expect(
      screen.getByRole("img", {
        name: "Скан формули Е.2 з ДБН В.2.1-10-2009",
      }),
    ).toHaveAttribute("src", "/dbn/soil-design-resistance/dbn-e2.png");
    expect(
      screen.getByRole("img", {
        name: "Скан табл. Е.7 з ДБН В.2.1-10-2009",
      }),
    ).toHaveAttribute("src", "/dbn/soil-design-resistance/dbn-table-e7.png");
    expect(
      screen.getByRole("img", {
        name: "Скан примітки 1 до табл. Е.7 з ДБН В.2.1-10-2009",
      }),
    ).toHaveAttribute("src", "/dbn/soil-design-resistance/dbn-table-e7-note-1.png");
    expect(
      screen.getByRole("img", {
        name: "Скан табл. Е.8 з ДБН В.2.1-10-2009",
      }),
    ).toHaveAttribute("src", "/dbn/soil-design-resistance/dbn-table-e8.png");

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Спосіб розрахунку" }),
      "automatic",
    );

    expect(screen.queryByRole("textbox", { name: "Коефіцієнт умов роботи 1" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Тип ґрунту" })).toHaveValue(
      "medium-sand",
    );
    expect(screen.getByRole("textbox", { name: "Довжина споруди" })).toHaveValue("8.25");
    expect(screen.getByRole("textbox", { name: "Висота споруди" })).toHaveValue("3");
    await user.click(screen.getByRole("button", { name: "Показати опис поля Довжина споруди" }));
    await user.click(screen.getByRole("button", { name: "Показати опис поля Висота споруди" }));
    expect(
      screen.getByText(/Довжина споруди або її відсіку L у базовій одиниці м/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Висота споруди або її відсіку H у базовій одиниці м/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("L/H = L / H = 8.25 / 3 = 2.75")).toBeInTheDocument();
    expect(
      screen.getByText((_, element) =>
        Boolean(
          element?.tagName.toLowerCase() === "p" &&
            element.textContent?.includes(
              "Конструктивна схема: жорстка. Для ґрунту \"Пісок середньої крупності\", L/H = 2.75 коефіцієнт γc2 визначається інтерполяцією згідно з приміткою 3 до табл. Е.7.",
            ),
        ),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        "γc2 = γc2,1.5 + (γc2,4 - γc2,1.5) * (L/H - 1.5) / (4 - 1.5) = 1.4 + (1.2 - 1.4) * (2.75 - 1.5) / 2.5 = 1.3",
      ),
    ).toBeInTheDocument();
  });

  it("keeps soil design resistance angle fixed and converts unit weights locally", async () => {
    const user = userEvent.setup();
    const calculator = getCalculatorBySlug("soil-design-resistance");

    if (!calculator) {
      throw new Error("Expected native soil design resistance calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    const phiUnitSelect = screen.getByRole("combobox", {
      name: "Одиниця Кут внутрішнього тертя",
    });
    const gammaUnitSelect = screen.getByRole("combobox", {
      name: "Одиниця Питома вага ґрунту нижче підошви",
    });
    const gammaPrimeUnitSelect = screen.getByRole("combobox", {
      name: "Одиниця Осереднена питома вага вище підошви",
    });

    expect(phiUnitSelect).toBeDisabled();
    expect(within(phiUnitSelect).getByRole("option", { name: "°" })).toHaveValue("deg");
    expect(within(phiUnitSelect).queryByRole("option", { name: "рад" })).not.toBeInTheDocument();
    expect(gammaUnitSelect).toBeEnabled();
    expect(gammaPrimeUnitSelect).toBeEnabled();
    expect(within(gammaUnitSelect).getByRole("option", { name: "кН/м³" })).toHaveValue(
      "kn-m3",
    );
    expect(within(gammaUnitSelect).getByRole("option", { name: "Н/м³" })).toHaveValue(
      "n-m3",
    );
    expect(within(gammaUnitSelect).getByRole("option", { name: "кгс/м³" })).toHaveValue(
      "kgf-m3",
    );
    expect(within(gammaUnitSelect).getByRole("option", { name: "тс/м³" })).toHaveValue(
      "tf-m3",
    );

    await user.selectOptions(gammaUnitSelect, "n-m3");

    expect(screen.getByRole("textbox", { name: "Кут внутрішнього тертя" })).toHaveValue(
      "30",
    );
    expect(
      screen.getByRole("textbox", { name: "Питома вага ґрунту нижче підошви" }),
    ).toHaveValue("17100");
    expect(
      screen.getByLabelText(
        "R = γc1 * γc2 / k * [Mγ * kz * b * γ11 + Mq * d1 * γ′11 + (Mq - 1) * db * γ′11 + Mc * c11] = 1 * 1 / 1 * [1.15 * 1 * 1 * 17.1 + 5.59 * 1.2 * 16.6 + (5.59 - 1) * 0 * 16.6 + 7.95 * 4] = 162.82 кПа",
      ),
    ).toBeInTheDocument();

    await user.clear(screen.getByRole("textbox", { name: "Питома вага ґрунту нижче підошви" }));
    await user.type(
      screen.getByRole("textbox", { name: "Питома вага ґрунту нижче підошви" }),
      "18000",
    );

    expect(
      screen.getByLabelText((label) => label.includes("1.15 * 1 * 1 * 18")),
    ).toBeInTheDocument();
  });

  it("uses a wider workspace for the soil resistance calculator diagram", () => {
    const calculator = getCalculatorBySlug("soil-design-resistance");

    if (!calculator) {
      throw new Error("Expected native soil design resistance calculator to exist");
    }

    const { container } = render(<CalculatorShell selectedCalculator={calculator} />);

    expect(container.querySelector(".workspace-content--soil-resistance")).toBeInTheDocument();
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
        level: 1,
        name: "Розподіл навантаження в кесонному перекритті",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Калькулятор коефіцієнтів c1 і c2 для розподілу навантаження"),
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Вихідні дані" })).toHaveClass(
      "input-schema-group",
    );
    expect(screen.getByText("Короткий проліт")).toBeInTheDocument();
    expect(screen.getByText("Довгий проліт")).toBeInTheDocument();
    expect(screen.getByText("Повне навантаження")).toBeInTheDocument();
    expect(screen.getByLabelText("Позначення lk")).toBeInTheDocument();
    expect(screen.getByLabelText("Позначення ld")).toBeInTheDocument();
    expect(screen.getByLabelText("Позначення q")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Короткий проліт" })).toHaveValue("3");
    expect(screen.getByRole("textbox", { name: "Довгий проліт" })).toHaveValue("6");
    expect(screen.getByRole("textbox", { name: "Повне навантаження" })).toHaveValue("10");
    expect(screen.queryByRole("textbox", { name: "lk, м" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "ld, м" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "q, кН/м²" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Одиниця Короткий проліт" })).toHaveValue("m");
    expect(screen.getByRole("combobox", { name: "Одиниця Довгий проліт" })).toHaveValue("m");
    expect(screen.getByRole("combobox", { name: "Одиниця Повне навантаження" })).toHaveValue("kn-m2");
    expect(
      screen.getByRole("textbox", { name: "Повне навантаження" }).closest(".input-schema-field"),
    ).toContainElement(
      screen.getByRole("combobox", { name: "Одиниця Повне навантаження" }),
    );
    const initialLoadDiagram = screen.getByRole("img", {
      name: "Параметрична схема розподілу навантаження q між напрямами lk і ld: lk 3 м, ld 6 м",
    });

    expect(initialLoadDiagram).toBeInTheDocument();
    expect(initialLoadDiagram.textContent).toContain("ld = 6 м");
    expect(initialLoadDiagram.textContent).toContain("lk = 3 м");
    expect(initialLoadDiagram.textContent).toContain("qk = 9.41 кН/м²");
    expect(initialLoadDiagram.textContent).toContain("qd = 0.59 кН/м²");
    expect(initialLoadDiagram.textContent?.match(/1 м/g) ?? []).toHaveLength(2);
    expect(initialLoadDiagram.textContent).not.toContain("l1 = 3 м");
    expect(
      screen.getByText(
        "На схемі показано, як повне навантаження q розподіляється між коротким напрямом qk та довгим напрямом qd. Заштриховані смуги відповідають ділянкам шириною 1 м, для яких наведено розміри lk і ld.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Параметрична схема:/)).not.toBeInTheDocument();
    const svgLines = [...initialLoadDiagram.querySelectorAll("line")];
    const topLoadLine = svgLines.find(
      (line) => Math.abs(getNumericAttribute(line, "x2") - getNumericAttribute(line, "x1")) > 250
        && getNumericAttribute(line, "y1") < 118,
    );
    const leftLoadLine = svgLines.find(
      (line) => Math.abs(getNumericAttribute(line, "y2") - getNumericAttribute(line, "y1")) > 120
        && getNumericAttribute(line, "x1") < 80,
    );

    expect(topLoadLine).toBeDefined();
    expect(leftLoadLine).toBeDefined();
    const topLoadHeight = 110 - getNumericAttribute(topLoadLine!, "y1");
    const leftLoadHeight = 120 - getNumericAttribute(leftLoadLine!, "x1");

    expect(topLoadHeight).toBeGreaterThanOrEqual(12);
    expect(topLoadHeight).toBeLessThan(leftLoadHeight);
    expect(leftLoadHeight).toBeGreaterThan(40);
    expect(
      screen.getByLabelText(
        "qk = c1 * q = 0.9412 * 10 = 9.41 кН/м²; qd = c2 * q = 0.0588 * 10 = 0.59 кН/м²",
      ),
    ).toBeInTheDocument();
    const coefficientsEquation = screen.getByLabelText(
      "c1 = ld^4 / (lk^4 + ld^4) = 6^4 / (3^4 + 6^4) = 0.9412; c2 = lk^4 / (lk^4 + ld^4) = 3^4 / (3^4 + 6^4) = 0.0588",
    );
    expect(coefficientsEquation.querySelectorAll(".report-formula__line")).toHaveLength(
      2,
    );
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

    await user.clear(screen.getByRole("textbox", { name: "Довгий проліт" }));
    await user.type(screen.getByRole("textbox", { name: "Довгий проліт" }), "6.3");

    expect(
      screen.getByText(/ld\/lk більше 2: за приміткою Ліновіча/),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("ld/lk = 2.1 > 2, тому приймаємо c1 = 1; c2 = 0"),
    ).toBeInTheDocument();
    const updatedLoadDiagram = screen.getByRole("img", {
      name: "Параметрична схема розподілу навантаження q між напрямами lk і ld: lk 3 м, ld 6.3 м",
    });

    expect(updatedLoadDiagram.textContent).toContain("ld = 6.3 м");
    expect(updatedLoadDiagram.textContent).toContain("qk = 10 кН/м²");
    expect(updatedLoadDiagram.textContent).toContain("qd = 0 кН/м²");
    const updatedTopLoadLine = [...updatedLoadDiagram.querySelectorAll("line")].find(
      (line) => Math.abs(getNumericAttribute(line, "x2") - getNumericAttribute(line, "x1")) > 250
        && getNumericAttribute(line, "y1") < 118,
    );

    expect(updatedTopLoadLine).toBeDefined();
    expect(110 - getNumericAttribute(updatedTopLoadLine!, "y1")).toBeCloseTo(0);
  });

  it("renders the native concrete exposure class calculator", () => {
    const calculator = getCalculatorBySlug("concrete-exposure-class");

    if (!calculator) {
      throw new Error("Expected native concrete exposure class calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Клас впливу середовища для бетону",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Калькулятор класу впливу середовища для бетону"),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Покроковий звіт" })).toBeInTheDocument();
  });

  it("renders the native concrete cover durability calculator", () => {
    const calculator = getCalculatorBySlug("concrete-cover-durability");

    if (!calculator) {
      throw new Error("Expected native concrete cover durability calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Захисний шар бетону для арматури",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Калькулятор захисного шару бетону для арматури"),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Покроковий звіт" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Розрахувати клас впливу" })).toBeInTheDocument();
  });

  it("stacks native cassoon load input fields vertically", () => {
    const css = readFileSync("app/globals.css", "utf8");

    expect(css).toMatch(
      /\.cassoon-load-controls\s*{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\);/,
    );
  });

  it("keeps soil resistance number field descriptions from shifting the input grid", () => {
    const css = readFileSync("app/globals.css", "utf8");

    expect(css).toMatch(
      /\.soil-resistance-field--number\s+\.soil-resistance-field__description\s*{[\s\S]*?min-height:\s*calc\(2em\s*\*\s*1\.35\);/,
    );
  });

  it("defines the shared dense input schema form layout", () => {
    const css = readFileSync("app/globals.css", "utf8");

    expect(css).toMatch(
      /\.input-schema-field\s*{[\s\S]*?grid-template-columns:\s*1\.9rem\s+3\.5rem\s+minmax\(8\.5rem,\s*0\.85fr\)\s+minmax\(9rem,\s*1fr\)\s+4\.85rem\s+2\.15rem;/,
    );
    expect(css).toMatch(/\.input-schema-field\s*{[\s\S]*?min-height:\s*34px;/);
    expect(css).toMatch(/\.input-schema-field__prefix\s*{[\s\S]*?justify-content:\s*center;/);
    expect(css).toMatch(
      /\.input-schema-field__control\s*{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)\s+4\.85rem;/,
    );
    expect(css).toMatch(
      /\.input-schema-field__calculator-action\s*{[\s\S]*?justify-content:\s*center;/,
    );
    expect(css).toMatch(/\.input-schema-field__unit\s*{[\s\S]*?width:\s*100%;/);
    expect(css).toMatch(/\.input-schema-field input\[type="text"\],[\s\S]*?height:\s*28px;/);
    expect(css).toMatch(
      /@media\s*\(max-width:\s*720px\)\s*{[\s\S]*?\.input-schema-field\s*{[\s\S]*?grid-template-columns:\s*2\.5rem\s+minmax\(0,\s*1fr\)\s+2\.15rem;/,
    );
    expect(css).toMatch(/\.input-schema-field__prefix\[data-empty="true"\]\s*{[\s\S]*?display:\s*none;/);
    expect(css).toMatch(
      /\.soil-resistance-controls\s+\.input-schema-field\s*{[\s\S]*?grid-template-columns:\s*1\.65rem\s+3rem\s+minmax\(6\.7rem,\s*0\.8fr\)\s+minmax\(7\.5rem,\s*1fr\)\s+4\.4rem\s+2rem;/,
    );
  });

  it("keeps soil resistance inspector fields stacked on narrow screens", () => {
    const css = readFileSync("app/globals.css", "utf8");

    expect(css).toMatch(
      /@media\s*\(max-width:\s*720px\)\s*{[\s\S]*?\.soil-resistance-controls\s+\.input-schema-field\s*{[\s\S]*?grid-template-columns:\s*2\.5rem\s+minmax\(0,\s*1fr\)\s+2\.15rem;/,
    );
    expect(css).toMatch(
      /@media\s*\(max-width:\s*720px\)\s*{[\s\S]*?\.soil-resistance-controls\s+\.input-schema-field__control\s*{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\);/,
    );
  });

  it("keeps the soil resistance diagram inside a larger responsive desktop track", () => {
    const css = readFileSync("app/globals.css", "utf8");

    expect(css).toMatch(
      /\.workspace-content--soil-resistance\s*{[\s\S]*?max-width:\s*1280px;/,
    );
    expect(css).toMatch(
      /\.soil-resistance-input-shell\s*{[\s\S]*?grid-template-columns:\s*minmax\(120px,\s*150px\)\s+minmax\(470px,\s*1fr\)\s+minmax\(400px,\s*500px\);/,
    );
    expect(css).toMatch(
      /\.soil-resistance-diagram__canvas\s*{[\s\S]*?max-width:\s*100%;/,
    );
    expect(css).toMatch(
      /@media\s*\(max-width:\s*1320px\)\s*{[\s\S]*?\.soil-resistance-input-shell\s*{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(280px,\s*340px\);/,
    );
  });

  it("shows soil resistance help actions for documented inspector fields", () => {
    const calculator = getCalculatorBySlug("soil-design-resistance");

    if (!calculator) {
      throw new Error("Expected native soil design resistance calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    expect(
      document.querySelector('button[aria-label="Показати опис поля Коефіцієнт умов роботи 1"]'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('button[aria-label="Показати опис поля Кут внутрішнього тертя"]'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('button[aria-label="Показати опис поля Ширина підошви"]'),
    ).toBeInTheDocument();
  });

  it("updates cassoon load units and normalizes reversed spans", async () => {
    const user = userEvent.setup();
    const calculator = getCalculatorBySlug("cassoon-load-distribution");

    if (!calculator) {
      throw new Error("Expected native cassoon load distribution calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Одиниця Повне навантаження" }), "n-m2");
    await user.selectOptions(screen.getByRole("combobox", { name: "Одиниця Короткий проліт" }), "cm");
    await user.selectOptions(screen.getByRole("combobox", { name: "Одиниця Довгий проліт" }), "mm");

    expect(screen.getByRole("textbox", { name: "Повне навантаження" })).toHaveValue("10000");
    expect(screen.getByRole("textbox", { name: "Короткий проліт" })).toHaveValue("300");
    expect(screen.getByRole("textbox", { name: "Довгий проліт" })).toHaveValue("6000");
    expect(screen.queryByRole("textbox", { name: "q, Н/м²" })).not.toBeInTheDocument();

    await user.clear(screen.getByRole("textbox", { name: "Короткий проліт" }));
    await user.type(screen.getByRole("textbox", { name: "Короткий проліт" }), "600");
    await user.clear(screen.getByRole("textbox", { name: "Довгий проліт" }));
    await user.type(screen.getByRole("textbox", { name: "Довгий проліт" }), "3000");

    expect(screen.queryByText("ld має бути не менше lk.")).not.toBeInTheDocument();
    expect(
      screen.getAllByText((_, element) =>
        Boolean(element?.textContent?.includes("прийнято lk = 3 м; ld = 6 м")),
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText((_, element) =>
        Boolean(element?.textContent?.includes("введено l1 = 6 м")),
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryAllByText((_, element) =>
        Boolean(element?.textContent?.includes("введено l2 = 3000 мм")),
      ).length,
    ).toBe(0);
    expect(
      screen.getAllByText((_, element) =>
        Boolean(element?.textContent?.includes("введено l2 = 3 м")),
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByLabelText(
        "qk = c1 * q = 0.9412 * 10 = 9.41 кН/м²; qd = c2 * q = 0.0588 * 10 = 0.59 кН/м²",
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
