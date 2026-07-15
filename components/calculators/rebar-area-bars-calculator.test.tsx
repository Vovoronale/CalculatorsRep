import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { RebarAreaBarsCalculator } from "./rebar-area-bars-calculator";

afterEach(cleanup);

describe("RebarAreaBarsCalculator", () => {
  it("converts the current physical area when the unit changes", async () => {
    const user = userEvent.setup();
    render(<RebarAreaBarsCalculator />);

    expect(screen.getByRole("spinbutton", { name: "Мінімальна площа, см²" })).toHaveValue(5);

    await user.click(screen.getByRole("radio", { name: "мм²" }));
    expect(screen.getByRole("spinbutton", { name: "Мінімальна площа, мм²" })).toHaveValue(500);

    await user.click(screen.getByRole("radio", { name: "м²" }));
    expect(screen.getByRole("spinbutton", { name: "Мінімальна площа, м²" })).toHaveValue(
      0.0005,
    );

    await user.click(screen.getByRole("radio", { name: "см²" }));
    expect(screen.getByRole("spinbutton", { name: "Мінімальна площа, см²" })).toHaveValue(5);
  });

  it("does not rewrite an empty or incomplete area while changing the unit", async () => {
    const user = userEvent.setup();
    render(<RebarAreaBarsCalculator />);
    const input = screen.getByRole("spinbutton", { name: "Мінімальна площа, см²" });

    fireEvent.change(input, { target: { value: "" } });
    await user.click(screen.getByRole("radio", { name: "мм²" }));

    expect(screen.getByRole("spinbutton", { name: "Мінімальна площа, мм²" })).toHaveValue(null);
  });

  it("keeps preset bar-count and spacing headers unique and normally labelled", () => {
    render(<RebarAreaBarsCalculator />);

    fireEvent.change(screen.getByRole("spinbutton", { name: "n" }), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: "s, мм" }), {
      target: { value: "100" },
    });

    const barsTable = screen.getByRole("table", {
      name: /Площа арматури для діаметра стержня та кількості стержнів/,
    });
    expect(within(barsTable).getAllByRole("columnheader", { name: "5" })).toHaveLength(1);
    expect(within(barsTable).queryByRole("columnheader", { name: "n = 5" })).not.toBeInTheDocument();

    const spacingTable = screen.getByRole("table", {
      name: /Площа арматури на 1 м\.п\. за діаметром і кроком стержнів/,
    });
    expect(
      within(spacingTable).getAllByRole("columnheader", { name: "100 мм" }),
    ).toHaveLength(1);
    expect(
      within(spacingTable).queryByRole("columnheader", { name: "s = 100 мм" }),
    ).not.toBeInTheDocument();
  });
});
