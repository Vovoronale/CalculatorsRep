import { readFileSync } from "node:fs";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NativeCalculatorLayout } from "./native-calculator-layout";
import { NativeReport } from "./native-report";

describe("NativeCalculatorLayout", () => {
  it("renders the shared input shell, menu links, summary, diagram, warnings, and errors", () => {
    render(
      <NativeCalculatorLayout
        ariaLabel="Тестовий калькулятор"
        navLinks={[
          { href: "#inputs", label: "Ввід" },
          { href: "#report", label: "Звіт" },
        ]}
        summary={<p>R = 120 кПа</p>}
        controls={<div id="inputs">controls</div>}
        diagramTitle="Позначення величин"
        diagrams={
          <figure>
            <figcaption>diagram</figcaption>
          </figure>
        }
        errors={["Помилка"]}
        warnings={["Попередження"]}
      >
        <section id="report">report</section>
      </NativeCalculatorLayout>,
    );

    const calculator = screen.getByLabelText("Тестовий калькулятор");
    const rail = within(calculator).getByRole("complementary", {
      name: "Навігація і результат",
    });
    const navigation = within(rail).getByRole("navigation", {
      name: "Розділи вводу",
    });
    const summary = within(rail).getByLabelText("Поточний результат");

    expect(calculator).toHaveClass("native-calculator");
    expect(
      navigation.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(within(calculator).getAllByText("Ввід")).toHaveLength(2);
    expect(within(calculator).getByRole("link", { name: "Звіт" })).toHaveAttribute(
      "href",
      "#report",
    );
    expect(within(calculator).getByText("R = 120 кПа")).toBeInTheDocument();
    expect(
      within(calculator).getByRole("heading", { name: "Позначення величин" }),
    ).toBeInTheDocument();
    expect(within(calculator).getByRole("alert")).toHaveTextContent("Помилка");
    expect(within(calculator).getByText("Попередження")).toBeInTheDocument();
  });

  it("uses a container-query workbench with a readable result rail", () => {
    const css = readFileSync("app/globals.css", "utf8");

    expect(css).toMatch(/\.native-calculator\s*{[\s\S]*?container-type:\s*inline-size;/);
    expect(css).toMatch(
      /\.native-calculator__rail\s*{[\s\S]*?width:\s*260px;[\s\S]*?min-width:\s*240px;/,
    );
    expect(css).toMatch(/@container\s*\(min-width:\s*1180px\)/);
    expect(css).toMatch(/@container\s*\(max-width:\s*819px\)/);
  });
});

describe("NativeReport", () => {
  it("renders captions, items, notes, and formulas with exact formula metadata", () => {
    render(
      <NativeReport
        titleId="test-report-title"
        title="Покроковий звіт"
        steps={[
          {
            key: "r",
            caption: "Визначення R:",
            items: ["b = 1 м"],
            notes: ["Примітка"],
            formula: "R = 120 кПа",
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Покроковий звіт" })).toBeInTheDocument();
    expect(screen.getByText("Визначення R:")).toBeInTheDocument();
    expect(screen.getByText("b = 1 м")).toBeInTheDocument();
    expect(screen.getByText("Примітка")).toBeInTheDocument();
    expect(screen.getByLabelText("R = 120 кПа")).toHaveAttribute("title", "R = 120 кПа");
  });
});
