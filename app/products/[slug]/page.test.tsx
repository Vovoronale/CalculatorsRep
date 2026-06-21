import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("@/components/product-view", () => ({
  ProductView: ({ product }: { product: { title: string } }) => (
    <div>{product.title}</div>
  ),
}));

import ProductPage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/products/[slug]/page";

afterEach(() => {
  cleanup();
  notFoundMock.mockClear();
});

describe("product page route", () => {
  it("generates a static route for each product", () => {
    expect(generateStaticParams()).toEqual([{ slug: "revit-screenshot" }]);
  });

  it("generates product metadata", async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ slug: "revit-screenshot" }) }),
    ).resolves.toMatchObject({
      title: "Revit Screenshot Plugin — завантаження та встановлення",
      description:
        "Завантажте Revit Screenshot Plugin для Autodesk Revit 2024, 2025 або 2026 та скористайтеся покроковою інструкцією встановлення.",
    });
  });

  it("renders the known product", async () => {
    render(
      await ProductPage({
        params: Promise.resolve({ slug: "revit-screenshot" }),
      }),
    );

    expect(screen.getByText("Revit Screenshot Plugin")).toBeInTheDocument();
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it("returns not found for an unknown product", async () => {
    await expect(
      ProductPage({ params: Promise.resolve({ slug: "missing-product" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledOnce();
  });
});
