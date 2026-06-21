import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { SearchInput } from "@/components/search-input";

afterEach(cleanup);

describe("SearchInput", () => {
  it("links product results to their internal product page", async () => {
    const user = userEvent.setup();
    render(<SearchInput />);

    await user.type(
      screen.getByRole("searchbox", { name: "Пошук калькуляторів" }),
      "Revit Screenshot",
    );

    expect(
      screen.getByRole("option", { name: /Revit Screenshot Plugin/ }),
    ).toHaveAttribute("href", "/products/revit-screenshot");
  });
});
