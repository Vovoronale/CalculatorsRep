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

    expect(calculator).toHaveClass("native-calculator");
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
