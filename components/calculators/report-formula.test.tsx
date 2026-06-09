import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReportFormula } from "./report-formula";

describe("ReportFormula", () => {
  it("preserves the exact original formula as aria-label and title", () => {
    const formula = "γc1 = 1.4; γc2 = 1.2";

    render(<ReportFormula formula={formula} />);

    const element = screen.getByLabelText(formula);
    expect(element).toHaveAttribute("title", formula);
  });

  it("renders supported formulas with KaTeX markup", () => {
    const formula = "Mγ = Mγ,a + (Mγ,b - Mγ,a) * (φ11 - φa) / (φb - φa) = 1.15";

    render(<ReportFormula formula={formula} />);

    const element = screen.getByLabelText(formula);
    expect(element.querySelector(".katex")).toBeInTheDocument();
    expect(element.textContent).toContain("M");
  });

  it("renders unsupported formulas as fallback text without throwing", () => {
    const formula = "Приймаємо значення з таблиці без математичного виразу";

    render(<ReportFormula formula={formula} />);

    const element = screen.getByLabelText(formula);
    expect(element).toHaveClass("report-formula--fallback");
    expect(element).toHaveTextContent(formula);
    expect(element.querySelector(".katex")).not.toBeInTheDocument();
  });
});
