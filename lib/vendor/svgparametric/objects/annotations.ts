import { svgElement } from "../core/svg";
import type { AnchorMap, BuildContext, ObjectDefinition, ParamMap, ParametricObject, ResolvedObject } from "../core/types";
import { lineVisualAttrs, numberParam, stringParam } from "./primitives";

abstract class BaseAnnotation implements ParametricObject {
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

export class Dimension extends BaseAnnotation {
  build(_context: BuildContext): ResolvedObject {
    const x1 = numberParam(this.params, "x1", 0);
    const y1 = numberParam(this.params, "y1", 0);
    const x2 = numberParam(this.params, "x2", 0);
    const y2 = numberParam(this.params, "y2", 0);
    const offset = numberParam(this.params, "offset", 0);
    const scale = numberParam(this.params, "scale", 1);
    const textOffset = numberParam(this.params, "textOffset", 6);
    const tickSize = numberParam(this.params, "tickSize", 10);
    const fontSize = numberParam(this.params, "fontSize", 14);
    const fontFamily = stringParam(this.params, "fontFamily", "ISOCPEUR, ISOCP, 'Arial Narrow', Arial, sans-serif");
    const prefix = stringParam(this.params, "prefix", "");
    const suffix = stringParam(this.params, "suffix", "");
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    const direction = length === 0 ? { x: 1, y: 0 } : { x: dx / length, y: dy / length };
    const normal = { x: -direction.y, y: direction.x };
    const dimensionStart = point(x1 + normal.x * offset, y1 + normal.y * offset);
    const dimensionEnd = point(x2 + normal.x * offset, y2 + normal.y * offset);
    const extensionGap = Math.min(Math.abs(offset), tickSize);
    const extensionDirection = offset === 0 ? { x: normal.x, y: normal.y } : { x: normal.x * Math.sign(offset), y: normal.y * Math.sign(offset) };
    const firstExtensionStart = point(x1 + extensionDirection.x * extensionGap, y1 + extensionDirection.y * extensionGap);
    const secondExtensionStart = point(x2 + extensionDirection.x * extensionGap, y2 + extensionDirection.y * extensionGap);
    const extensionOverrun = tickSize / 2;
    const firstExtensionEnd = point(
      dimensionStart.x + extensionDirection.x * extensionOverrun,
      dimensionStart.y + extensionDirection.y * extensionOverrun
    );
    const secondExtensionEnd = point(
      dimensionEnd.x + extensionDirection.x * extensionOverrun,
      dimensionEnd.y + extensionDirection.y * extensionOverrun
    );
    const dimensionLineStart = point(dimensionStart.x - direction.x * extensionOverrun, dimensionStart.y - direction.y * extensionOverrun);
    const dimensionLineEnd = point(dimensionEnd.x + direction.x * extensionOverrun, dimensionEnd.y + direction.y * extensionOverrun);
    const mid = point((dimensionStart.x + dimensionEnd.x) / 2, (dimensionStart.y + dimensionEnd.y) / 2);
    const vertical = Math.abs(dx) < 0.000001 && Math.abs(dy) > 0.000001;
    const labelPoint = vertical
      ? point(mid.x - textOffset, mid.y)
      : point(mid.x - normal.x * textOffset, mid.y - normal.y * textOffset);
    const lineAngle = roundSvg(Math.atan2(direction.y, direction.x) * (180 / Math.PI));
    const angle = vertical ? -90 : lineAngle;
    const label = `${prefix}${formatDimensionValue(length * scale)}${suffix}`;
    const attrs = lineVisualAttrs(this.params, { color: "black", strokeWidth: 0.6 });
    const tickDirection = normalize({ x: direction.x + normal.x, y: direction.y + normal.y });
    const firstTick = tickLine(dimensionStart, tickDirection, tickSize);
    const secondTick = tickLine(dimensionEnd, tickDirection, tickSize);
    const anchors = {
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      dimensionStart,
      dimensionEnd,
      label: labelPoint
    };
    const node = svgElement("g", {}, [
      svgElement("line", { x1: firstExtensionStart.x, y1: firstExtensionStart.y, x2: firstExtensionEnd.x, y2: firstExtensionEnd.y, ...attrs }),
      svgElement("line", { x1: secondExtensionStart.x, y1: secondExtensionStart.y, x2: secondExtensionEnd.x, y2: secondExtensionEnd.y, ...attrs }),
      svgElement("line", { x1: dimensionLineStart.x, y1: dimensionLineStart.y, x2: dimensionLineEnd.x, y2: dimensionLineEnd.y, ...attrs }),
      svgElement("line", { x1: firstTick.x1, y1: firstTick.y1, x2: firstTick.x2, y2: firstTick.y2, ...attrs }),
      svgElement("line", { x1: secondTick.x1, y1: secondTick.y1, x2: secondTick.x2, y2: secondTick.y2, ...attrs }),
      svgElement(
        "text",
        {
          x: labelPoint.x,
          y: labelPoint.y,
          "text-anchor": "middle",
          "dominant-baseline": "middle",
          "font-family": fontFamily,
          "font-size": fontSize,
          transform: `rotate(${formatNumber(angle)} ${formatNumber(labelPoint.x)} ${formatNumber(labelPoint.y)})`
        },
        [label]
      )
    ]);

    return { id: this.id, type: this.type, params: this.params, style: this.style, anchors, children: [], node };
  }
}

export class Callout extends BaseAnnotation {
  build(_context: BuildContext): ResolvedObject {
    const x1 = numberParam(this.params, "x1", 0);
    const y1 = numberParam(this.params, "y1", 0);
    const x2 = numberParam(this.params, "x2", 40);
    const y2 = numberParam(this.params, "y2", 20);
    const arrowSize = numberParam(this.params, "arrowSize", 8);
    const fontSize = numberParam(this.params, "fontSize", 14);
    const lineSpacing = numberParam(this.params, "lineSpacing", fontSize * 1.2);
    const textOffset = numberParam(this.params, "textOffset", 6);
    const textInset = numberParam(this.params, "textInset", 3);
    const textWidthFactor = numberParam(this.params, "textWidthFactor", 0.7);
    const fontFamily = stringParam(this.params, "fontFamily", "ISOCPEUR, ISOCP, 'Arial Narrow', Arial, sans-serif");
    const orientation = stringParam(this.params, "orientation", "horizontal");
    const text = stringParam(this.params, "text", "");
    const lines = text.split(/\r?\n/);
    const effectiveShelfLength = automaticShelfLength(lines[0] ?? "", fontSize, textInset, textWidthFactor);
    const vertical = orientation === "vertical";
    const shelfEnd = vertical ? point(x2, y2 + effectiveShelfLength) : point(x2 + effectiveShelfLength, y2);
    const labelPoint = point(x2 + textInset, y2 - textOffset);
    const attrs = lineVisualAttrs(this.params, { color: "black", strokeWidth: 0.6 });
    const color = stringParam(this.params, "color", "black");
    const arrow = arrowPath(point(x1, y1), point(x2, y2), arrowSize);
    const anchors = {
      target: { x: x1, y: y1 },
      shelfStart: { x: x2, y: y2 },
      shelfEnd,
      label: labelPoint
    };
    const node = svgElement("g", {}, [
      svgElement("line", { x1: x2, y1: y2, x2: shelfEnd.x, y2: shelfEnd.y, ...attrs }),
      svgElement("line", { x1, y1, x2, y2, ...attrs }),
      svgElement("path", { d: arrow, fill: color, ...attrs }),
      svgElement(
        "text",
        {
          x: labelPoint.x,
          y: labelPoint.y,
          fill: color,
          "font-family": fontFamily,
          "font-size": fontSize,
          transform: `rotate(${vertical ? 90 : 0} ${formatNumber(labelPoint.x)} ${formatNumber(labelPoint.y)})`
        },
        lines.map((line, index) =>
          svgElement("tspan", { x: labelPoint.x, dy: index === 0 ? 0 : roundSvg(lineSpacing) }, [line])
        )
      )
    ]);

    return { id: this.id, type: this.type, params: this.params, style: this.style, anchors, children: [], node };
  }
}

function automaticShelfLength(firstLine: string, fontSize: number, textInset: number, textWidthFactor: number): number {
  return roundSvg(textInset + firstLine.length * fontSize * textWidthFactor + 6);
}

function arrowPath(
  target: { x: number; y: number },
  leaderEnd: { x: number; y: number },
  size: number
): string {
  const direction = normalize({ x: leaderEnd.x - target.x, y: leaderEnd.y - target.y });
  const normal = { x: -direction.y, y: direction.x };
  const base = point(target.x + direction.x * size, target.y + direction.y * size);
  const halfWidth = size / 2;
  const left = point(base.x + normal.x * halfWidth, base.y + normal.y * halfWidth);
  const right = point(base.x - normal.x * halfWidth, base.y - normal.y * halfWidth);

  return `M ${formatNumber(left.x)} ${formatNumber(left.y)} L ${formatNumber(target.x)} ${formatNumber(target.y)} L ${formatNumber(right.x)} ${formatNumber(right.y)} Z`;
}

function point(x: number, y: number): { x: number; y: number } {
  return { x: roundSvg(x), y: roundSvg(y) };
}

function tickLine(
  center: { x: number; y: number },
  direction: { x: number; y: number },
  size: number
): { x1: number; y1: number; x2: number; y2: number } {
  const half = size / 2;
  return {
    x1: roundSvg(center.x - direction.x * half),
    y1: roundSvg(center.y - direction.y * half),
    x2: roundSvg(center.x + direction.x * half),
    y2: roundSvg(center.y + direction.y * half)
  };
}

function normalize(vector: { x: number; y: number }): { x: number; y: number } {
  const length = Math.hypot(vector.x, vector.y);
  if (length === 0) return { x: 1, y: 0 };
  return { x: vector.x / length, y: vector.y / length };
}

function formatDimensionValue(value: number): string {
  const rounded = roundSvg(value);
  if (Math.abs(rounded - Math.round(rounded)) < 0.000001) return String(Math.round(rounded));
  return formatNumber(rounded);
}

function formatNumber(value: number): string {
  return String(roundSvg(value));
}

function normalizeAngle(value: number): number {
  const normalized = ((value + 180) % 360 + 360) % 360 - 180;
  return roundSvg(normalized);
}

function roundSvg(value: number): number {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}
