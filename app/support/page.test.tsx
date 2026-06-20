import { existsSync } from "node:fs";
import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";

import { afterEach, describe, expect, it } from "vitest";

import SupportPage from "@/app/support/page";

const patreonHref =
  "https://patreon.com/u93873537?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_fan&utm_content=copyLink";

describe("SupportPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("defines the static support route", () => {
    expect(existsSync("app/support/page.tsx")).toBe(true);
  });

  it("renders approved support copy and the external Patreon action", () => {
    render(<SupportPage />);

    const rail = screen.getByRole("complementary", { name: "Каталог калькуляторів" });
    const workspace = screen.getByRole("main");

    expect(within(rail).getByText("Калькулятори")).toBeInTheDocument();
    expect(
      within(workspace).getByRole("heading", {
        level: 1,
        name: "Подобається IVApps.pro? Підтримайте розвиток сервісу",
      }),
    ).toBeInTheDocument();
    expect(workspace).toHaveTextContent(
      "Підпишіться на Patreon CadEE.pro. Навіть безкоштовна підписка допомагає популяризувати наші інженерні сервіси та залучати ресурси для створення нових калькуляторів.",
    );
    expect(workspace).toHaveTextContent(
      "IVApps.pro і CadEE.pro містять різні типи калькуляторів, але розробляються одним автором. Тому підтримка обох проєктів об’єднана на одній сторінці Patreon CadEE.pro.",
    );
    expect(workspace).toHaveTextContent(
      "Якщо IVApps.pro корисний для вас і ви хочете підтримати його активний розвиток, можете обрати платний рівень підписки.",
    );

    const patreonLink = within(workspace).getByRole("link", {
      name: "Підтримати проєкти на Patreon",
    });

    expect(patreonLink).toHaveAttribute("href", patreonHref);
    expect(patreonLink).toHaveAttribute("target", "_blank");
    expect(patreonLink).toHaveAttribute("rel", "noreferrer");
    expect(document.querySelectorAll("h1")).toHaveLength(1);
  });
});
