import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import AuthorPage from "@/app/author/page";

describe("AuthorPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the author content inside the shared engineering shell", () => {
    render(<AuthorPage />);

    const rail = screen.getByRole("complementary", { name: "Каталог калькуляторів" });
    const workspace = screen.getByRole("main");

    expect(within(rail).getByText("Іванейко Володимир")).toBeInTheDocument();
    expect(within(rail).getByRole("link", { name: "CadEE.pro" })).toHaveAttribute(
      "href",
      "https://cadee.pro",
    );
    expect(
      within(workspace).getByRole("heading", { level: 1, name: "Іванейко Володимир" }),
    ).toBeInTheDocument();
    expect(
      within(workspace).getByText(/засновник цифрових інженерних продуктів/i),
    ).toBeInTheDocument();
    expect(
      within(workspace).getByRole("heading", { name: "Інженерні розрахунки" }),
    ).toBeInTheDocument();
    expect(within(workspace).getByRole("heading", { name: "ШІ-асистенти" })).toBeInTheDocument();
    expect(within(workspace).getByRole("link", { name: "ДБН В.2.2-5:2023" })).toHaveAttribute(
      "href",
      "https://chatgpt.com/g/g-679fe1d48b6c8191a2b9b2dc0e38e431-dbn-v-2-2-5-2023",
    );
    expect(within(workspace).getByRole("link", { name: "ДБН В.2.5-67:2013" })).toHaveAttribute(
      "href",
      "https://chatgpt.com/g/g-67bb9c7d29e481919219dfe99e246a96-dbn-v-2-5-67-2013",
    );
  });
});
