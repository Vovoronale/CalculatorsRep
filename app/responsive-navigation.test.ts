import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("responsive catalog rail", () => {
  it("does not visually collapse an open rail at tablet widths", () => {
    const css = readFileSync(path.resolve("app/globals.css"), "utf8");

    expect(css).not.toContain('.site-shell:not([data-collapsed="true"])');
  });
});
