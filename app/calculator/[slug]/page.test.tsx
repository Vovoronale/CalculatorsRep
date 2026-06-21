import { describe, expect, it } from "vitest";

import { generateStaticParams } from "@/app/calculator/[slug]/page";

describe("calculator static routes", () => {
  it("does not generate duplicate calculator routes for product entries", async () => {
    const params = await generateStaticParams();

    expect(params).not.toContainEqual({ slug: "revit-screenshot-plugin" });
    expect(params).toContainEqual({ slug: "soil-design-resistance" });
  });
});
