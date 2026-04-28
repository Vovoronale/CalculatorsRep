"use client";

import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { siteContent } from "@/lib/site-content";

export function ProductsDropdown() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const { products, productsLabel, allProductsLabel, allProductsHref } =
    siteContent.topbar;

  return (
    <div ref={containerRef} className="products-dropdown">
      <button
        ref={triggerRef}
        type="button"
        className="products-dropdown__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((prev) => !prev)}
      >
        {productsLabel}
        <ChevronDown
          size={12}
          aria-hidden
          className={open ? "products-dropdown__chevron is-open" : "products-dropdown__chevron"}
        />
      </button>

      {open ? (
        <div className="products-dropdown__panel" role="menu">
          <div className="products-dropdown__list">
            {products.map((product) =>
              product.external ? (
                <a
                  key={product.label}
                  href={product.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`products-dropdown__item${product.active ? " is-active" : ""}`}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  <span className="products-dropdown__item-main">
                    <span className="products-dropdown__item-label">{product.label}</span>
                    {product.tagline ? (
                      <span className="products-dropdown__item-tagline">{product.tagline}</span>
                    ) : null}
                  </span>
                  <ExternalLink size={12} aria-hidden className="products-dropdown__item-icon" />
                </a>
              ) : (
                <Link
                  key={product.label}
                  href={product.href}
                  className={`products-dropdown__item${product.active ? " is-active" : ""}`}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  <span className="products-dropdown__item-main">
                    <span className="products-dropdown__item-label">{product.label}</span>
                    {product.tagline ? (
                      <span className="products-dropdown__item-tagline">{product.tagline}</span>
                    ) : null}
                  </span>
                </Link>
              ),
            )}
          </div>
          <Link
            href={allProductsHref}
            className="products-dropdown__all"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            {allProductsLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
