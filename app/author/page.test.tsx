import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AuthorPage from "@/app/author/page";

describe("AuthorPage", () => {
  it("renders the author positioning, project categories, and assistant links", () => {
    render(<AuthorPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Іванейко Володимир" })).toBeInTheDocument();
    expect(screen.getByText(/CTO \/ Head of AI R&D/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Теплотехнічні розрахунки" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ШІ-асистенти" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ДБН В.2.2-5:2023" })).toHaveAttribute(
      "href",
      "https://chatgpt.com/g/g-679fe1d48b6c8191a2b9b2dc0e38e431-dbn-v-2-2-5-2023",
    );
    expect(screen.getByRole("link", { name: "ДБН В.2.5-67:2013" })).toHaveAttribute(
      "href",
      "https://chatgpt.com/g/g-67bb9c7d29e481919219dfe99e246a96-dbn-v-2-5-67-2013",
    );
  });
});
