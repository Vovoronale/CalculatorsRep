import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("RootLayout analytics", () => {
  it("loads Google Analytics once through Next Script for every page", () => {
    const layoutSource = readFileSync("app/layout.tsx", "utf8");
    const afterInteractiveScripts = layoutSource.match(/strategy="afterInteractive"/g) ?? [];

    expect(layoutSource).toMatch(/import\s+Script\s+from\s+"next\/script";/);
    expect(layoutSource).toContain('const googleAnalyticsId = "G-LFC4DCDX7V";');
    expect(layoutSource).toContain(
      "https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}",
    );
    expect(layoutSource).toContain('id="google-analytics"');
    expect(layoutSource).toContain("window.dataLayer = window.dataLayer || [];");
    expect(layoutSource).toContain("gtag('js', new Date());");
    expect(layoutSource).toContain("gtag('config', '${googleAnalyticsId}');");
    expect(afterInteractiveScripts).toHaveLength(2);
  });
});
