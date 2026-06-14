import { describe, expect, it } from "vitest";

import robots, { dynamic } from "@/app/robots";

describe("robots metadata route", () => {
  it("allows indexing and points crawlers to the sitemap", () => {
    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
      },
      sitemap: "https://ivapps.pro/sitemap.xml",
      host: "https://ivapps.pro",
    });
  });

  it("is static-export compatible", () => {
    expect(dynamic).toBe("force-static");
  });
});
