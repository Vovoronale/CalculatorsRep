import { afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import type { CalculatorInputField } from "@/lib/calculator-input-schema";

import {
  SOIL_INPUT_SCHEMA,
  SoilDesignResistanceCalculator,
} from "./soil-design-resistance-calculator";

afterEach(() => {
  cleanup();
});

function findSchemaField(id: string): CalculatorInputField {
  for (const group of SOIL_INPUT_SCHEMA.groups) {
    const field = group.fields.find((item) => item.id === id);
    if (field) return field;
  }
  throw new Error(`Missing schema field ${id}`);
}

function expectTextDescription(field: CalculatorInputField, pattern: RegExp) {
  expect(field.description).toBeTruthy();
  expect(field.description).toMatch(pattern);
}

describe("SOIL_INPUT_SCHEMA", () => {
  it("defines complete inspector metadata for key fields", () => {
    const expected = [
      ["gammaC1Manual", "coefficient", { text: "γ", subscript: "c1", ariaLabel: "γc1" }],
      ["gammaC2Manual", "coefficient", { text: "γ", subscript: "c2", ariaLabel: "γc2" }],
      ["buildingLengthM", "length", { text: "L", ariaLabel: "L" }],
      ["buildingHeightM", "length", { text: "H", ariaLabel: "H" }],
      ["liquidityIndex", "coefficient", { text: "I", subscript: "L", ariaLabel: "IL" }],
      ["phi11Deg", "angle", { text: "φ", subscript: "11", ariaLabel: "φ11" }],
      ["gamma11KnM3", "unitWeight", { text: "γ", subscript: "11", ariaLabel: "γ11" }],
      ["gammaPrime11KnM3", "unitWeight", { text: "γ′", subscript: "11", ariaLabel: "γ′11" }],
      ["c11KPa", "pressure", { text: "c", subscript: "11", ariaLabel: "c11" }],
      ["foundationWidthM", "length", { text: "b", ariaLabel: "b" }],
      ["foundationDepthM", "length", { text: "d", ariaLabel: "d" }],
      ["embedmentDepthD1M", "length", { text: "d", subscript: "1", ariaLabel: "d1" }],
      ["basementDepthInputM", "length", { text: "d", subscript: "b,input", ariaLabel: "db,input" }],
      ["soilLayerAboveFootingHsM", "length", { text: "h", subscript: "s", ariaLabel: "hs" }],
      ["basementFloorThicknessHcfM", "length", { text: "h", subscript: "cf", ariaLabel: "hcf" }],
      ["basementFloorUnitWeightGammaCfKnM3", "unitWeight", { text: "γ", subscript: "cf", ariaLabel: "γcf" }],
    ] as const;

    for (const [id, quantity, prefix] of expected) {
      const field = findSchemaField(id);
      expect(field).toMatchObject({
        kind: "number",
        quantity,
        prefix,
      });
      if (id !== "phi11Deg") {
        expect(field).not.toHaveProperty("displayUnits");
      }
      expect(field.description, id).toBeTruthy();
      expect(field.description, id).not.toBe(field.name);
    }

    expect(findSchemaField("hasBasement")).toMatchObject({
      kind: "checkbox",
      name: "Є підвал?",
    });
    expect(findSchemaField("basementDepthInputM")).toMatchObject({
      kind: "number",
      defaultValue: "1.5",
    });
    expect(findSchemaField("phi11Deg")).toMatchObject({
      kind: "number",
      displayUnits: [{ value: "deg", label: "°", factorToBase: 1 }],
    });

    expectTextDescription(findSchemaField("gammaC1Manual"), /табл\. Е\.7/);
    expectTextDescription(findSchemaField("liquidityIndex"), /глинист/);
    expectTextDescription(findSchemaField("phi11Deg"), /табл\. Е\.8/);
    expectTextDescription(findSchemaField("strengthSource"), /п\. Е\.4/);
  });
});

describe("SoilDesignResistanceCalculator diagrams", () => {
  function getDiagram(container: HTMLElement, label: string): SVGElement {
    const diagram = container.querySelector(`svg[role='img'][aria-label*='${label}']`);
    if (!(diagram instanceof SVGElement)) {
      throw new Error(`Missing diagram with label ${label}`);
    }
    return diagram;
  }

  function getLoadBand(diagram: SVGElement): Element {
    const loadBand = diagram.querySelector("rect[fill='#f3cccc']");
    if (!loadBand) {
      throw new Error("Missing foundation load band");
    }
    return loadBand;
  }

  function numericAttribute(element: Element, name: string): number {
    const value = element.getAttribute(name);
    if (value === null) {
      throw new Error(`Missing ${name} attribute`);
    }
    return Number(value);
  }

  function getViewBoxNumbers(diagram: SVGElement): number[] {
    return (diagram.getAttribute("viewBox") ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .map(Number);
  }

  it("renders the no-basement foundation diagram by default", () => {
    const { container } = render(createElement(SoilDesignResistanceCalculator));
    const diagram = container.querySelector(
      "svg[role='img'][aria-label*='Схема фундаменту без підвалу']",
    );

    expect(diagram).not.toBeNull();
    expect(diagram?.textContent).toContain("b=1 м");
    expect(diagram?.textContent).toContain("d1=1.2 м");
    expect(diagram?.textContent).toContain("R=162.8 кПа");
    expect(screen.getByText("Позначення величин")).toBeInTheDocument();
  });

  it("keeps the soil friction angle unit fixed to degrees", () => {
    render(createElement(SoilDesignResistanceCalculator));

    const angleUnit = screen.getByRole("combobox", {
      name: "Одиниця Кут внутрішнього тертя",
    });

    expect(angleUnit).toBeDisabled();
    expect(angleUnit).toHaveTextContent("°");
    expect(angleUnit).not.toHaveTextContent("рад");
  });

  it("changes no-basement foundation geometry when footing width changes", () => {
    const { container } = render(createElement(SoilDesignResistanceCalculator));
    const widthInput = screen.getByRole("textbox", { name: "Ширина підошви" });
    const initialDiagram = getDiagram(container, "Схема фундаменту без підвалу");
    const initialLoadBand = getLoadBand(initialDiagram);

    expect(numericAttribute(initialLoadBand, "width")).toBe(180);

    fireEvent.change(widthInput, { target: { value: "2" } });

    const updatedDiagram = getDiagram(container, "Схема фундаменту без підвалу");
    const updatedLoadBand = getLoadBand(updatedDiagram);

    expect(numericAttribute(updatedLoadBand, "width")).toBe(360);
    expect(updatedDiagram.textContent).toContain("b=2 м");
  });

  it("changes no-basement foundation geometry when embedment depth changes", () => {
    const { container } = render(createElement(SoilDesignResistanceCalculator));
    const depthInput = screen.getByRole("textbox", {
      name: "Приведена глибина закладання",
    });
    const initialLoadBand = getLoadBand(
      getDiagram(container, "Схема фундаменту без підвалу"),
    );

    expect(numericAttribute(initialLoadBand, "y")).toBe(368);

    fireEvent.change(depthInput, { target: { value: "2" } });

    const updatedDiagram = getDiagram(container, "Схема фундаменту без підвалу");
    const updatedLoadBand = getLoadBand(updatedDiagram);

    expect(numericAttribute(updatedLoadBand, "y")).toBe(512);
    expect(updatedDiagram.textContent).toContain("d1=2 м");
  });

  it("renders the basement foundation diagram after enabling basement mode", () => {
    const { container } = render(createElement(SoilDesignResistanceCalculator));

    fireEvent.click(screen.getByRole("checkbox", { name: /є підвал/i }));
    const diagram = container.querySelector(
      "svg[role='img'][aria-label*='Схема фундаменту з підвалом']",
    );

    expect(diagram).not.toBeNull();
    expect(diagram?.textContent).toContain("b=1 м");
    expect(diagram?.textContent).toContain("dB=1.5 м");
    expect(diagram?.textContent).toContain("h_cf=0.2 м");
  });

  it("changes basement foundation geometry when basement inputs change", () => {
    const { container } = render(createElement(SoilDesignResistanceCalculator));

    fireEvent.click(screen.getByRole("checkbox", { name: /є підвал/i }));

    const widthInput = screen.getByRole("textbox", { name: "Ширина підошви" });
    const basementDepthInput = screen.getByRole("textbox", { name: "Глибина підвалу" });
    const floorThicknessInput = screen.getByRole("textbox", {
      name: "Товщина підлоги підвалу",
    });
    const initialDiagram = getDiagram(container, "Схема фундаменту з підвалом");
    const initialLoadBand = getLoadBand(initialDiagram);

    expect(numericAttribute(initialLoadBand, "width")).toBe(180);

    fireEvent.change(widthInput, { target: { value: "2" } });
    fireEvent.change(basementDepthInput, { target: { value: "1.5" } });
    fireEvent.change(floorThicknessInput, { target: { value: "0.35" } });

    const updatedDiagram = getDiagram(container, "Схема фундаменту з підвалом");
    const updatedLoadBand = getLoadBand(updatedDiagram);

    expect(numericAttribute(updatedLoadBand, "width")).toBe(360);
    expect(updatedDiagram.textContent).toContain("b=2 м");
    expect(updatedDiagram.textContent).toContain("dB=1.5 м");
    expect(updatedDiagram.textContent).toContain("h_cf=0.35 м");
    expect(numericAttribute(updatedLoadBand, "y")).toBeGreaterThan(
      numericAttribute(initialLoadBand, "y"),
    );
  });

  it("uses a viewBox that keeps foundation annotations inside the diagram", () => {
    const { container } = render(createElement(SoilDesignResistanceCalculator));
    const widthInput = screen.getByRole("textbox", { name: "Ширина підошви" });
    const depthInput = screen.getByRole("textbox", {
      name: "Приведена глибина закладання",
    });

    fireEvent.change(widthInput, { target: { value: "3" } });
    fireEvent.change(depthInput, { target: { value: "2" } });

    const diagram = getDiagram(container, "Схема фундаменту без підвалу");
    const loadBand = getLoadBand(diagram);
    const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = getViewBoxNumbers(diagram);
    const loadX = numericAttribute(loadBand, "x");
    const loadY = numericAttribute(loadBand, "y");
    const loadWidth = numericAttribute(loadBand, "width");
    const loadHeight = numericAttribute(loadBand, "height");

    expect(viewBoxX).toBeLessThanOrEqual(loadX);
    expect(viewBoxY).toBeLessThanOrEqual(0);
    expect(viewBoxX + viewBoxWidth).toBeGreaterThanOrEqual(loadX + loadWidth);
    expect(viewBoxY + viewBoxHeight).toBeGreaterThanOrEqual(loadY + loadHeight + 34);
  });
});
