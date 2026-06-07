import { rectangleAnchors } from "../core/anchors";
import { svgElement } from "../core/svg";
import type { AnchorMap, BuildContext, ObjectDefinition, ParamMap, ParametricObject, ResolvedObject, SvgNode } from "../core/types";

abstract class BaseObject implements ParametricObject {
  public readonly type: string;
  public readonly params: ParamMap;
  public readonly style: ParamMap;
  public anchors: AnchorMap = {};
  public children: ParametricObject[] = [];

  constructor(public readonly id: string, definition: ObjectDefinition) {
    this.type = definition.type;
    this.params = definition.params ?? {};
    this.style = definition.style ?? {};
  }

  abstract build(context: BuildContext): ResolvedObject;
}

export class Group extends BaseObject {
  build(_context: BuildContext): ResolvedObject {
    const node = svgElement("g", lineVisualAttrs(this.params), []);
    return { id: this.id, type: this.type, params: this.params, style: this.style, anchors: {}, children: [], node };
  }
}

export class RectBlock extends BaseObject {
  build(_context: BuildContext): ResolvedObject {
    const x = numberParam(this.params, "x", 0);
    const y = numberParam(this.params, "y", 0);
    const width = numberParam(this.params, "width", 100);
    const height = numberParam(this.params, "height", 100);
    const anchors = rectangleAnchors({ x, y, width, height });
    const fill = stringParam(this.params, "fill", "none");
    const hatch = hatchFill(this.id, this.params);
    const rect = svgElement("rect", { x, y, width, height, fill: hatch?.fill ?? fill, ...lineVisualAttrs(this.params) });
    const node = hatch ? svgElement("g", {}, [svgElement("defs", {}, [hatch.pattern]), rect]) : rect;

    return { id: this.id, type: this.type, params: this.params, style: this.style, anchors, children: [], node };
  }
}

export class Line extends BaseObject {
  build(_context: BuildContext): ResolvedObject {
    const x1 = numberParam(this.params, "x1", 0);
    const y1 = numberParam(this.params, "y1", 0);
    const x2 = numberParam(this.params, "x2", 0);
    const y2 = numberParam(this.params, "y2", 0);
    const node = svgElement("line", { x1, y1, x2, y2, ...lineVisualAttrs(this.params) });

    return {
      id: this.id,
      type: this.type,
      params: this.params,
      style: this.style,
      anchors: { start: { x: x1, y: y1 }, end: { x: x2, y: y2 } },
      children: [],
      node
    };
  }
}

export class Point extends BaseObject {
  build(_context: BuildContext): ResolvedObject {
    const x = numberParam(this.params, "x", 0);
    const y = numberParam(this.params, "y", 0);
    const diameter = numberParam(this.params, "diameter", 6);
    const fill = stringParam(this.params, "fill", "");
    const node = svgElement("circle", { cx: x, cy: y, r: diameter / 2, fill, ...lineVisualAttrs(this.params) });

    return {
      id: this.id,
      type: this.type,
      params: this.params,
      style: this.style,
      anchors: { center: { x, y } },
      children: [],
      node
    };
  }
}

export class TextLabel extends BaseObject {
  build(_context: BuildContext): ResolvedObject {
    const x = numberParam(this.params, "x", 0);
    const y = numberParam(this.params, "y", 0);
    const text = stringParam(this.params, "text", "");
    const node = svgElement("text", { x, y, ...textVisualAttrs(this.params) }, [text]);

    return {
      id: this.id,
      type: this.type,
      params: this.params,
      style: this.style,
      anchors: { origin: { x, y } },
      children: [],
      node
    };
  }
}

export function numberParam(params: ParamMap, key: string, fallback: number): number {
  const value = params[key];
  return typeof value === "number" ? value : fallback;
}

export function stringParam(params: ParamMap, key: string, fallback: string): string {
  const value = params[key];
  return typeof value === "string" ? value : fallback;
}

export function booleanParam(params: ParamMap, key: string, fallback: boolean): boolean {
  const value = params[key];
  return typeof value === "boolean" ? value : fallback;
}

interface HatchDefinition {
  type: string;
  spacing: number;
  color: string;
  strokeWidth: number;
}

function hatchFill(ownerId: string, params: ParamMap): { fill: string; pattern: SvgNode } | undefined {
  const hatch = normalizeHatch(params.hatch);
  if (!hatch) return undefined;

  const id = `${sanitizeSvgId(ownerId)}-hatch`;
  const pattern = svgElement(
    "pattern",
    {
      id,
      width: hatch.spacing,
      height: hatch.spacing,
      patternUnits: "userSpaceOnUse"
    },
    [hatchPath(hatch)]
  );

  return { fill: `url(#${id})`, pattern };
}

function normalizeHatch(value: ParamMap[string]): HatchDefinition | undefined {
  if (typeof value === "string") {
    return hatchDefinition({ type: value });
  }

  if (!isParamMap(value)) return undefined;

  return hatchDefinition({
    type: stringParam(value, "type", ""),
    spacing: numberParam(value, "spacing", 8),
    color: stringParam(value, "color", "black"),
    strokeWidth: numberParam(value, "strokeWidth", 1)
  });
}

function hatchDefinition(params: Partial<HatchDefinition>): HatchDefinition | undefined {
  const type = params.type ?? "";
  if (type !== "horizontal" && type !== "vertical" && type !== "diagonal") return undefined;

  return {
    type,
    spacing: params.spacing ?? 8,
    color: params.color ?? "black",
    strokeWidth: params.strokeWidth ?? 1
  };
}

function hatchPath(hatch: HatchDefinition): SvgNode {
  if (hatch.type === "horizontal") {
    return svgElement("path", { d: `M 0 0 L ${hatch.spacing} 0`, stroke: hatch.color, "stroke-width": hatch.strokeWidth });
  }

  if (hatch.type === "vertical") {
    return svgElement("path", { d: `M 0 0 L 0 ${hatch.spacing}`, stroke: hatch.color, "stroke-width": hatch.strokeWidth });
  }

  return svgElement("path", {
    d: `M 0 ${hatch.spacing} L ${hatch.spacing} 0`,
    stroke: hatch.color,
    "stroke-width": hatch.strokeWidth
  });
}

function isParamMap(value: ParamMap[string]): value is ParamMap {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeSvgId(value: string): string {
  const id = value.replace(/[^A-Za-z0-9_-]/g, "_");
  return id || "rect";
}

export function lineVisualParams(
  params: ParamMap,
  defaults: { color?: string; strokeWidth?: number; lineType?: string } = {}
): ParamMap {
  const color = stringParam(params, "color", defaults.color ?? "");
  const strokeWidth = numberParam(params, "strokeWidth", defaults.strokeWidth ?? Number.NaN);
  const lineType = stringParam(params, "lineType", defaults.lineType ?? "");
  const result: ParamMap = {};

  if (color) result.color = color;
  if (!Number.isNaN(strokeWidth)) result.strokeWidth = strokeWidth;
  if (lineType) result.lineType = lineType;

  return result;
}

export function lineVisualAttrs(
  params: ParamMap,
  defaults: { color?: string; strokeWidth?: number; lineType?: string } = {}
): Record<string, string | number | undefined> {
  const visualParams = lineVisualParams(params, defaults);
  const attrs: Record<string, string | number | undefined> = {};
  const color = stringParam(visualParams, "color", "");
  const strokeWidth = numberParam(visualParams, "strokeWidth", Number.NaN);
  const lineType = stringParam(visualParams, "lineType", "solid");

  if (color) attrs.stroke = color;
  if (!Number.isNaN(strokeWidth)) attrs["stroke-width"] = strokeWidth;
  attrs["stroke-dasharray"] = strokeDashArray(lineType);

  return attrs;
}

export function textVisualAttrs(params: ParamMap): Record<string, string | number | undefined> {
  const attrs: Record<string, string | number | undefined> = {};
  const color = stringParam(params, "color", "");
  const fontSize = numberParam(params, "fontSize", Number.NaN);
  const fontFamily = stringParam(params, "fontFamily", "");
  const textAnchor = stringParam(params, "textAnchor", "");

  if (color) attrs.fill = color;
  if (!Number.isNaN(fontSize)) attrs["font-size"] = fontSize;
  if (fontFamily) attrs["font-family"] = fontFamily;
  if (textAnchor) attrs["text-anchor"] = textAnchor;

  return attrs;
}

function strokeDashArray(lineType: string): string | undefined {
  if (lineType === "dashed") return "8 4";
  if (lineType === "dotted") return "2 4";
  return undefined;
}
