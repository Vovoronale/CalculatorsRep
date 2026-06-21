import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DbnSourceLink } from "./dbn-source-link";

afterEach(cleanup);

const cases = [
  [
    "dbn-v-2-6-198-2014",
    "https://e-construction.gov.ua/laws_detail/3870232666225772499?doc_type=2",
    "Відкрити ДБН на e-construction",
  ],
  [
    "dbn-v-2-1-10-2009",
    "https://dbn.co.ua/dbn/DBN_V.2.1-10-2009.pdf",
    "Відкрити ДБН на dbn.co.ua",
  ],
  [
    "dbn-v-2-6-98-2009",
    "https://e-construction.gov.ua/laws_detail/3873881846584444859?doc_type=2",
    "Відкрити ДБН на e-construction",
  ],
  [
    "dbn-b-2-2-12-2019",
    "https://e-construction.gov.ua/laws_detail/3874277768581612585?doc_type=2",
    "Відкрити ДБН на e-construction",
  ],
  [
    "dbn-v-2-3-15-2007",
    "https://e-construction.gov.ua/laws_detail/3875034753086261244?doc_type=2",
    "Відкрити ДБН на e-construction",
  ],
] as const;

describe("DbnSourceLink", () => {
  it.each(cases)("renders the verified %s source", (document, href, label) => {
    render(<DbnSourceLink document={document} />);

    const link = screen.getByRole("link", { name: label });
    expect(link).toHaveAttribute("href", href);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveClass("dbn-source-link");
  });
});
