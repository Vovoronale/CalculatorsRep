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
    expect(generateStaticParams()).toEqual([
      { slug: "revit-screenshot" },
      { slug: "xref-to-current" },
      { slug: "text2tabel" },
    ]);
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

  it("generates XRef product metadata", async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ slug: "xref-to-current" }) }),
    ).resolves.toMatchObject({
      title: "XRef to Current Drawing (X2C) — завантажити AutoCAD LISP",
      description:
        "Завантажте XRef2Current.lsp для копіювання вкладених об’єктів із Xref у поточне креслення AutoCAD. Команда X2C, опис роботи та інструкція встановлення.",
    });
  });

  it("generates Text2Tabel product metadata", async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ slug: "text2tabel" }) }),
    ).resolves.toMatchObject({
      title: "Text2Tabel — завантажити AutoCAD LISP",
      description:
        "Завантажте Text2Tabel.lsp для створення AutoCAD Table з тексту, MTEXT або лінійної сітки таблиці. Команда Text2Tabel, режими роботи та інструкція встановлення.",
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

  it("renders the known XRef product", async () => {
    render(
      await ProductPage({
        params: Promise.resolve({ slug: "xref-to-current" }),
      }),
    );

    expect(screen.getByText("XRef to Current Drawing (X2C)")).toBeInTheDocument();
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it("renders the known Text2Tabel product", async () => {
    render(
      await ProductPage({
        params: Promise.resolve({ slug: "text2tabel" }),
      }),
    );

    expect(screen.getByText("Text2Tabel")).toBeInTheDocument();
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it("returns not found for an unknown product", async () => {
    await expect(
      ProductPage({ params: Promise.resolve({ slug: "missing-product" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledOnce();
  });
});
