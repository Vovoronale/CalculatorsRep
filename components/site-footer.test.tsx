import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SiteFooter } from "@/components/site-footer";

describe("SiteFooter", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders product and legal navigation links", () => {
    render(<SiteFooter />);

    const footer = screen.getByRole("contentinfo");

    expect(within(footer).getByRole("link", { name: "IVapps.pro" })).toHaveAttribute("href", "/");
    expect(within(footer).getByText(/Цифрова платформа розрахункових інструментів/)).toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: "Про автора" })).toHaveAttribute(
      "href",
      "/author",
    );
    expect(within(footer).getByRole("link", { name: "CadEE.pro" })).toHaveAttribute(
      "href",
      "https://cadee.pro",
    );
    expect(
      within(footer).getByRole("link", { name: "Відмова від відповідальності" }),
    ).toHaveAttribute("href", "/disclaimer");
    expect(within(footer).getByRole("link", { name: "Умови використання" })).toHaveAttribute(
      "href",
      "/terms",
    );
    expect(within(footer).getByRole("link", { name: "Конфіденційність" })).toHaveAttribute(
      "href",
      "/privacy",
    );
    expect(within(footer).getByRole("link", { name: "Ivapps.pro@gmail.com" })).toHaveAttribute(
      "href",
      "mailto:Ivapps.pro@gmail.com",
    );
  });
});
