import type { ImgHTMLAttributes } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProductView } from "@/components/product-view";
import { getProductBySlug } from "@/lib/products";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} />
  ),
}));

vi.mock("@/components/catalog-rail", () => ({
  CatalogRail: () => <aside data-testid="catalog-rail" />,
}));

vi.mock("@/components/drawer-backdrop", () => ({
  DrawerBackdrop: () => null,
}));

vi.mock("@/components/mobile-top-bar", () => ({
  MobileTopBar: () => <div data-testid="mobile-top-bar" />,
}));

vi.mock("@/components/workspace-top-bar", () => ({
  WorkspaceTopBar: () => <nav data-testid="workspace-top-bar" />,
}));

vi.mock("@/components/site-footer", () => ({
  SiteFooter: () => <footer data-testid="site-footer" />,
}));

afterEach(cleanup);

describe("ProductView", () => {
  it("renders the approved product sections in order", () => {
    const product = getProductBySlug("revit-screenshot");
    expect(product).toBeDefined();

    render(<ProductView product={product!} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Revit Screenshot Plugin" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual([
      "Що вміє плагін",
      "Опис плагіну",
      "Скріншоти плагіну",
      "Завантаження за версіями Revit",
      "Повна інструкція встановлення",
      "Ліцензійні умови",
    ]);
  });

  it("renders accessible screenshots and versioned downloads", () => {
    const product = getProductBySlug("revit-screenshot")!;
    render(<ProductView product={product} />);

    expect(screen.getByRole("link", { name: "Скачати плагін" })).toHaveAttribute(
      "href",
      "#downloads",
    );

    const downloads = screen.getByRole("region", {
      name: "Завантаження за версіями Revit",
    });
    for (const download of product.downloads) {
      expect(
        within(downloads).getByRole("link", {
          name: download.ariaLabel,
        }),
      ).toHaveAttribute("href", download.href);
    }

    for (const screenshot of product.screenshots ?? []) {
      expect(screen.getByRole("img", { name: screenshot.alt })).toBeInTheDocument();
    }
  });

  it("marks installation values as code and shows the license", () => {
    render(<ProductView product={getProductBySlug("revit-screenshot")!} />);

    expect(screen.getByText("RevitScreenshot.dll").tagName).toBe("CODE");
    expect(
      screen.getByText("%AppData%\\Autodesk\\Revit\\Addins\\2026\\").tagName,
    ).toBe("CODE");
    expect(screen.getByText("Тип ліцензії: пропрієтарна (IVSoft).")).toBeVisible();
  });
});
