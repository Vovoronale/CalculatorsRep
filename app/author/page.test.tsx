import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import AuthorPage from "@/app/author/page";

const patreonHref =
  "https://patreon.com/u93873537?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_fan&utm_content=copyLink";

describe("AuthorPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the author content inside the shared engineering shell", () => {
    render(<AuthorPage />);

    const rail = screen.getByRole("complementary", { name: "Каталог калькуляторів" });
    const workspace = screen.getByRole("main");

    expect(within(rail).getByText("Калькулятори")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "CadEE.pro" })[0]).toHaveAttribute(
      "href",
      "https://cadee.pro",
    );
    expect(
      within(workspace).getByRole("heading", { level: 1, name: "Іванейко Володимир" }),
    ).toBeInTheDocument();
    expect(within(workspace).getAllByText(/співзасновник logistruct/i).length).toBeGreaterThan(0);
    expect(
      within(workspace).getByText(/head of ai r&d/i),
    ).toBeInTheDocument();
    expect(
      within(workspace).getByText(/окремий напрям моєї роботи — ai r&d/i),
    ).toBeInTheDocument();
    expect(
      within(workspace).getByText(/виросли з практики проектування будівель у цілому/i),
    ).toBeInTheDocument();
    expect(within(workspace).getByRole("link", { name: "Facebook" })).toHaveAttribute(
      "href",
      "https://www.facebook.com/iv.mybox",
    );
    expect(within(workspace).getByRole("link", { name: "Instagram" })).toHaveAttribute(
      "href",
      "https://www.instagram.com/ivolodumur/",
    );
    expect(within(workspace).getByRole("link", { name: "Threads" })).toHaveAttribute(
      "href",
      "https://www.threads.com/@ivolodumur",
    );
    expect(within(workspace).getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/володимир-іванейко-607650254",
    );
    const patreonLink = within(workspace).getByRole("link", {
      name: "Patreon CadEE.pro",
    });
    expect(patreonLink).toHaveAttribute("href", patreonHref);
    expect(patreonLink).toHaveAttribute("target", "_blank");
    expect(patreonLink).toHaveAttribute("rel", "noreferrer");
    expect(
      within(workspace).queryByRole("heading", { name: "Екосистема продуктів" }),
    ).not.toBeInTheDocument();
    expect(
      within(workspace).queryByRole("heading", { name: "ШІ-асистенти" }),
    ).not.toBeInTheDocument();
  });
});
