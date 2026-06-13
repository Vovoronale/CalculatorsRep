import { svgElement } from "../core/svg";
import type { ParamMap, SvgNode } from "../core/types";
import { lineVisualAttrs, numberParam } from "./primitives";

export interface FoundationGeometry {
  x: number;
  groundY: number;
  width: number;
  depth: number;
  baseHeight: number;
  stemWidth: number;
  stemHeightAboveGround: number;
  bottomY: number;
  baseTopY: number;
  stemLeft: number;
  stemRight: number;
  stemTopY: number;
  centerX: number;
}

export function foundationGeometry(params: ParamMap): FoundationGeometry {
  const x = numberParam(params, "x", 0);
  const groundY = numberParam(params, "y", 0);
  const width = numberParam(params, "width", 320);
  const depth = numberParam(params, "depth", 170);
  const baseHeight = numberParam(params, "baseHeight", depth * 0.28);
  const stemWidth = numberParam(params, "stemWidth", width * 0.32);
  const stemHeightAboveGround = numberParam(params, "stemHeightAboveGround", depth * 0.4);
  const bottomY = groundY + depth;
  const baseTopY = bottomY - baseHeight;
  const stemLeft = x + (width - stemWidth) / 2;
  const stemRight = stemLeft + stemWidth;
  const stemTopY = groundY - stemHeightAboveGround;
  const centerX = x + width / 2;

  return {
    x,
    groundY,
    width,
    depth,
    baseHeight,
    stemWidth,
    stemHeightAboveGround,
    bottomY,
    baseTopY,
    stemLeft,
    stemRight,
    stemTopY,
    centerX
  };
}

export function effectiveLoadHeight(params: ParamMap, fallback: number): number {
  if (typeof params.loadHeight === "number") return params.loadHeight;

  const value = params.loadValue;
  const scale = numberParam(params, "loadHeightScale", Number.NaN);
  if (typeof value !== "number" || Number.isNaN(scale)) return fallback;

  const minHeight = numberParam(params, "loadMinHeight", 0);
  return Math.max(minHeight, Math.abs(value) * scale);
}

export function foundationHatchPattern(id: string, fill: string, color: string, spacing: number, strokeWidth: number): SvgNode {
  return svgElement("defs", {}, [
    svgElement(
      "pattern",
      {
        id,
        width: spacing,
        height: spacing,
        patternUnits: "userSpaceOnUse"
      },
      [
        svgElement("rect", { x: 0, y: 0, width: spacing, height: spacing, fill }),
        svgElement("path", { d: `M 0 ${formatNumber(spacing)} L ${formatNumber(spacing)} 0`, stroke: color, "stroke-width": strokeWidth })
      ]
    )
  ]);
}

export function foundationPath(geometry: FoundationGeometry): string {
  const { x, bottomY, width, baseTopY, stemLeft, stemRight, stemTopY } = geometry;

  return [
    `M ${formatNumber(stemLeft)} ${formatNumber(stemTopY)}`,
    `L ${formatNumber(stemRight)} ${formatNumber(stemTopY)}`,
    `L ${formatNumber(stemRight)} ${formatNumber(baseTopY)}`,
    `L ${formatNumber(x + width)} ${formatNumber(baseTopY)}`,
    `L ${formatNumber(x + width)} ${formatNumber(bottomY)}`,
    `L ${formatNumber(x)} ${formatNumber(bottomY)}`,
    `L ${formatNumber(x)} ${formatNumber(baseTopY)}`,
    `L ${formatNumber(stemLeft)} ${formatNumber(baseTopY)}`,
    "Z"
  ].join(" ");
}

export function groundNodes(geometry: FoundationGeometry, visualParams: ParamMap): SvgNode[] {
  const { x, width, groundY, stemLeft, stemRight } = geometry;
  const extension = 40;
  const hatchSpacing = 16;
  const hatchLength = 10;
  const attrs = lineVisualAttrs(visualParams, { color: "black", strokeWidth: 1.4 });
  const nodes = [
    svgElement("line", { x1: x - extension, y1: groundY, x2: stemLeft, y2: groundY, ...attrs }),
    svgElement("line", { x1: stemRight, y1: groundY, x2: x + width + extension, y2: groundY, ...attrs })
  ];

  for (let hx = x - extension + hatchSpacing; hx < stemLeft - 4; hx += hatchSpacing) {
    nodes.push(svgElement("line", { x1: roundSvg(hx), y1: groundY, x2: roundSvg(hx - hatchLength), y2: roundSvg(groundY + hatchLength), ...attrs }));
  }

  for (let hx = stemRight + hatchSpacing; hx < x + width + extension; hx += hatchSpacing) {
    nodes.push(svgElement("line", { x1: roundSvg(hx), y1: groundY, x2: roundSvg(hx - hatchLength), y2: roundSvg(groundY + hatchLength), ...attrs }));
  }

  return nodes;
}

export function point(x: number, y: number): { x: number; y: number } {
  return { x: roundSvg(x), y: roundSvg(y) };
}

export function formatNumber(value: number): string {
  return String(roundSvg(value));
}

export function roundSvg(value: number): number {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function sanitizeSvgId(value: string): string {
  const id = value.replace(/[^A-Za-z0-9_-]/g, "_");
  return id || "loadedFoundation";
}
