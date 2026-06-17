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
    const textWidthFactor = numberParam(this.params, "textWidthFactor", 0.45);
    const textPadding = numberParam(this.params, "textPadding", 2);
    const outsideTextOffset = numberParam(this.params, "outsideTextOffset", fontSize * 2 + 2);
    const outsideTextInset = numberParam(this.params, "outsideTextInset", 3);
    const fontFamily = stringParam(this.params, "fontFamily", "ISOCPEUR, ISOCP, 'Arial Narrow', Arial, sans-serif");
    const prefix = stringParam(this.params, "prefix", "");
    const suffix = stringParam(this.params, "suffix", "");
    const labelPlacement = stringParam(this.params, "labelPlacement", "auto");
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
    const lineAngle = roundSvg(Math.atan2(direction.y, direction.x) * (180 / Math.PI));
    const angle = vertical ? -90 : lineAngle;
    const label = `${prefix}${formatDimensionValue(length * scale)}${suffix}`;
    const labelWidth = estimateTextWidth(label, fontSize, textWidthFactor);
    const labelFits = labelWidth <= Math.max(0, length - textPadding * 2);
    const shouldMoveLabel = !labelFits || labelPlacement === "outside" || labelPlacement === "end";
    const outsideDirection = offset === 0
      ? { x: -normal.x, y: -normal.y }
      : { x: normal.x * Math.sign(offset), y: normal.y * Math.sign(offset) };
    const oppositeNormal = { x: -normal.x, y: -normal.y };
    const aboveShelfDirection = normal.y < oppositeNormal.y
      ? normal
      : oppositeNormal.y < normal.y
        ? oppositeNormal
        : outsideDirection;
    const endTextStart = point(
      dimensionEnd.x + direction.x * outsideTextOffset,
      dimensionEnd.y + direction.y * outsideTextOffset
    );
    const endLeaderEnd = point(
      endTextStart.x + direction.x * labelWidth,
      endTextStart.y + direction.y * labelWidth
    );
    const endLabelPoint = point(
      endTextStart.x + aboveShelfDirection.x * textOffset,
      endTextStart.y + aboveShelfDirection.y * textOffset
    );
    const outsideBend = point(
      mid.x + outsideDirection.x * outsideTextOffset + direction.x * outsideTextOffset,
      mid.y + outsideDirection.y * outsideTextOffset + direction.y * outsideTextOffset
    );
    const outsideShelfLength = outsideTextInset + labelWidth;
    const outsideShelfEnd = point(
      outsideBend.x + direction.x * outsideShelfLength,
      outsideBend.y + direction.y * outsideShelfLength
    );
    const outsideTextAdvance = vertical && direction.y > 0
      ? outsideTextInset + labelWidth
      : outsideTextInset;
    const outsideTextSideDirection = vertical
      ? { x: -outsideDirection.x, y: -outsideDirection.y }
      : aboveShelfDirection;
    const outsideLabelPoint = point(
      outsideBend.x + direction.x * outsideTextAdvance + outsideTextSideDirection.x * textOffset,
      outsideBend.y + direction.y * outsideTextAdvance + outsideTextSideDirection.y * textOffset
    );
    const labelPoint = labelPlacement === "end"
      ? endLabelPoint
      : shouldMoveLabel
        ? outsideLabelPoint
        : vertical
          ? point(mid.x - textOffset, mid.y)
          : point(mid.x - normal.x * textOffset, mid.y - normal.y * textOffset);
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
    const labelLeader = labelPlacement === "end"
      ? [svgElement("line", { x1: dimensionEnd.x, y1: dimensionEnd.y, x2: endLeaderEnd.x, y2: endLeaderEnd.y, ...attrs })]
      : shouldMoveLabel
        ? [
            svgElement("line", { x1: mid.x, y1: mid.y, x2: outsideBend.x, y2: outsideBend.y, ...attrs }),
            svgElement("line", { x1: outsideBend.x, y1: outsideBend.y, x2: outsideShelfEnd.x, y2: outsideShelfEnd.y, ...attrs })
          ]
        : [];
    const outsideText = shouldMoveLabel && labelPlacement !== "end";
    const textAnchor = outsideText || labelPlacement === "end" ? "start" : "middle";
    const node = svgElement("g", {}, [
      svgElement("line", { x1: firstExtensionStart.x, y1: firstExtensionStart.y, x2: firstExtensionEnd.x, y2: firstExtensionEnd.y, ...attrs }),
      svgElement("line", { x1: secondExtensionStart.x, y1: secondExtensionStart.y, x2: secondExtensionEnd.x, y2: secondExtensionEnd.y, ...attrs }),
      svgElement("line", { x1: dimensionLineStart.x, y1: dimensionLineStart.y, x2: dimensionLineEnd.x, y2: dimensionLineEnd.y, ...attrs }),
      svgElement("line", { x1: firstTick.x1, y1: firstTick.y1, x2: firstTick.x2, y2: firstTick.y2, ...attrs }),
      svgElement("line", { x1: secondTick.x1, y1: secondTick.y1, x2: secondTick.x2, y2: secondTick.y2, ...attrs }),
      ...labelLeader,
      svgElement(
        "text",
        {
          x: labelPoint.x,
          y: labelPoint.y,
          "text-anchor": textAnchor,
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

export class DistributedLoad extends BaseAnnotation {
  build(_context: BuildContext): ResolvedObject {
    const x1 = numberParam(this.params, "x1", 0);
    const y1 = numberParam(this.params, "y1", 0);
    const x2 = numberParam(this.params, "x2", 100);
    const y2 = numberParam(this.params, "y2", 0);
    const offset = numberParam(this.params, "offset", -30);
    const explicitHeight = distributedLoadHeight(this.params);
    const arrowSpacing = numberParam(this.params, "arrowSpacing", 40);
    const arrowSize = numberParam(this.params, "arrowSize", 10);
    const textOffset = numberParam(this.params, "textOffset", 16);
    const fontSize = numberParam(this.params, "fontSize", 14);
    const fontFamily = stringParam(this.params, "fontFamily", "ISOCPEUR, ISOCP, 'Arial Narrow', Arial, sans-serif");
    const prefix = stringParam(this.params, "prefix", "");
    const suffix = stringParam(this.params, "suffix", "");
    const value = displayValue(this.params.value);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    const direction = length === 0 ? { x: 1, y: 0 } : { x: dx / length, y: dy / length };
    const normal = { x: -direction.y, y: direction.x };
    const heightDirection = offset === 0 ? -1 : Math.sign(offset);
    const tipOffset = explicitHeight === undefined ? 0 : offset;
    const loadOffset = explicitHeight === undefined ? offset : offset + explicitHeight * heightDirection;
    const tipStart = point(x1 + normal.x * tipOffset, y1 + normal.y * tipOffset);
    const tipEnd = point(x2 + normal.x * tipOffset, y2 + normal.y * tipOffset);
    const loadStart = point(x1 + normal.x * loadOffset, y1 + normal.y * loadOffset);
    const loadEnd = point(x2 + normal.x * loadOffset, y2 + normal.y * loadOffset);
    const arrowDirection = normalize({ x: tipStart.x - loadStart.x, y: tipStart.y - loadStart.y });
    const labelPoint = point((loadStart.x + loadEnd.x) / 2 - arrowDirection.x * textOffset, (loadStart.y + loadEnd.y) / 2 - arrowDirection.y * textOffset);
    const attrs = lineVisualAttrs(this.params, { color: "black", strokeWidth: 0.6 });
    const color = stringParam(this.params, "color", "black");
    const segmentCount = length === 0 ? 0 : Math.max(1, Math.ceil(length / Math.max(arrowSpacing, 1)));
    const arrows = [];

    for (let index = 0; index <= segmentCount; index += 1) {
      const t = segmentCount === 0 ? 0 : index / segmentCount;
      const shaftStart = point(loadStart.x + (loadEnd.x - loadStart.x) * t, loadStart.y + (loadEnd.y - loadStart.y) * t);
      const tip = point(tipStart.x + (tipEnd.x - tipStart.x) * t, tipStart.y + (tipEnd.y - tipStart.y) * t);
      const headBack = point(tip.x - arrowDirection.x * arrowSize, tip.y - arrowDirection.y * arrowSize);
      const headHalfWidth = arrowSize / 2;
      const firstHead = point(headBack.x + direction.x * headHalfWidth, headBack.y + direction.y * headHalfWidth);
      const secondHead = point(headBack.x - direction.x * headHalfWidth, headBack.y - direction.y * headHalfWidth);

      arrows.push(
        svgElement("line", { x1: shaftStart.x, y1: shaftStart.y, x2: tip.x, y2: tip.y, ...attrs }),
        svgElement("line", { x1: firstHead.x, y1: firstHead.y, x2: tip.x, y2: tip.y, ...attrs }),
        svgElement("line", { x1: secondHead.x, y1: secondHead.y, x2: tip.x, y2: tip.y, ...attrs })
      );
    }

    const anchors = {
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      loadStart,
      loadEnd,
      label: labelPoint
    };
    const lineAngle = roundSvg(Math.atan2(direction.y, direction.x) * (180 / Math.PI));
    const node = svgElement("g", {}, [
      svgElement("line", { x1: loadStart.x, y1: loadStart.y, x2: loadEnd.x, y2: loadEnd.y, ...attrs }),
      ...arrows,
      svgElement(
        "text",
        {
          x: labelPoint.x,
          y: labelPoint.y,
          fill: color,
          "text-anchor": "middle",
          "dominant-baseline": "middle",
          "font-family": fontFamily,
          "font-size": fontSize,
          transform: `rotate(${formatNumber(lineAngle)} ${formatNumber(labelPoint.x)} ${formatNumber(labelPoint.y)})`
        },
        [`${prefix}${value}${suffix}`]
      )
    ]);

    return { id: this.id, type: this.type, params: this.params, style: this.style, anchors, children: [], node };
  }
}

export class Force extends BaseAnnotation {
  build(_context: BuildContext): ResolvedObject {
    const x = numberParam(this.params, "x", 0);
    const y = numberParam(this.params, "y", 0);
    const angle = numberParam(this.params, "angle", -90);
    const directionSign = numberParam(this.params, "direction", 1) < 0 ? -1 : 1;
    const axis = directionFromAngle(angle, directionSign);
    const length = forceVisibleLength(this.params);
    const arrowSize = numberParam(this.params, "arrowSize", 10);
    const textOffset = numberParam(this.params, "textOffset", 16);
    const fontSize = numberParam(this.params, "fontSize", 14);
    const effectiveTextOffset = Math.max(textOffset, fontSize * 0.9);
    const fontFamily = stringParam(this.params, "fontFamily", "ISOCPEUR, ISOCP, 'Arial Narrow', Arial, sans-serif");
    const prefix = stringParam(this.params, "prefix", "");
    const suffix = stringParam(this.params, "suffix", "");
    const textPosition = stringParam(this.params, "textPosition", "tail");
    const textPlacement = stringParam(this.params, "textPlacement", "auto");
    const labelRotation = stringParam(this.params, "labelRotation", "horizontal");
    const target = point(x, y);
    const tail = point(x - axis.x * length, y - axis.y * length);
    const mid = point((target.x + tail.x) / 2, (target.y + tail.y) / 2);
    const labelBase = forceLabelBase(textPosition, target, tail, mid);
    const normal = { x: -axis.y, y: axis.x };
    const labelDirection = forceLabelDirection(textPlacement, axis, normal);
    const labelPoint = point(labelBase.x + labelDirection.x * effectiveTextOffset, labelBase.y + labelDirection.y * effectiveTextOffset);
    const headBack = point(target.x - axis.x * arrowSize, target.y - axis.y * arrowSize);
    const headHalfWidth = arrowSize / 2;
    const firstHead = point(headBack.x - normal.x * headHalfWidth, headBack.y - normal.y * headHalfWidth);
    const secondHead = point(headBack.x + normal.x * headHalfWidth, headBack.y + normal.y * headHalfWidth);
    const attrs = lineVisualAttrs(this.params, { color: "black", strokeWidth: 0.6 });
    const color = stringParam(this.params, "color", "black");
    const label = `${prefix}${displayValue(this.params.value)}${suffix}`;
    const rotation = labelRotation === "axis" ? readableTextAngle(angle + (directionSign < 0 ? 180 : 0)) : 0;
    const anchors = {
      target,
      tail,
      mid,
      label: labelPoint
    };
    const node = svgElement("g", {}, [
      svgElement("line", { x1: tail.x, y1: tail.y, x2: target.x, y2: target.y, ...attrs }),
      svgElement("line", { x1: firstHead.x, y1: firstHead.y, x2: target.x, y2: target.y, ...attrs }),
      svgElement("line", { x1: secondHead.x, y1: secondHead.y, x2: target.x, y2: target.y, ...attrs }),
      svgElement(
        "text",
        {
          x: labelPoint.x,
          y: labelPoint.y,
          fill: color,
          "text-anchor": "middle",
          "dominant-baseline": "middle",
          "font-family": fontFamily,
          "font-size": fontSize,
          transform: `rotate(${formatNumber(rotation)} ${formatNumber(labelPoint.x)} ${formatNumber(labelPoint.y)})`
        },
        [label]
      )
    ]);

    return { id: this.id, type: this.type, params: this.params, style: this.style, anchors, children: [], node };
  }
}

export class BreakLine extends BaseAnnotation {
  build(_context: BuildContext): ResolvedObject {
    const x1 = numberParam(this.params, "x1", 0);
    const y1 = numberParam(this.params, "y1", 0);
    const x2 = numberParam(this.params, "x2", 40);
    const y2 = numberParam(this.params, "y2", 0);
    const amplitude = numberParam(this.params, "amplitude", 8);
    const waveCount = Math.max(1, Math.round(numberParam(this.params, "waveCount", 1)));
    const overhang = numberParam(this.params, "overhang", 16);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    const direction = length === 0 ? { x: 1, y: 0 } : { x: dx / length, y: dy / length };
    const normal = { x: -direction.y, y: direction.x };
    const defaultBreakLength = Math.min(Math.max(amplitude * 3, 1), length || amplitude * 3);
    const breakLength = Math.min(Math.max(numberParam(this.params, "breakLength", defaultBreakLength), 0), length);
    const center = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
    const breakStart = {
      x: center.x - direction.x * (breakLength / 2),
      y: center.y - direction.y * (breakLength / 2)
    };
    const breakEnd = {
      x: center.x + direction.x * (breakLength / 2),
      y: center.y + direction.y * (breakLength / 2)
    };
    const pathStart = { x: x1 - direction.x * overhang, y: y1 - direction.y * overhang };
    const pathEnd = { x: x2 + direction.x * overhang, y: y2 + direction.y * overhang };
    const segmentCount = waveCount * 2 + 1;
    const commands = [
      `M ${formatNumber(pathStart.x)} ${formatNumber(pathStart.y)}`,
      `L ${formatNumber(breakStart.x)} ${formatNumber(breakStart.y)}`
    ];

    for (let index = 1; index < segmentCount; index += 1) {
      const t = index / segmentCount;
      const offset = (index % 2 === 1 ? -1 : 1) * amplitude;
      const x = breakStart.x + direction.x * breakLength * t + normal.x * offset;
      const y = breakStart.y + direction.y * breakLength * t + normal.y * offset;
      commands.push(`L ${formatNumber(x)} ${formatNumber(y)}`);
    }

    commands.push(`L ${formatNumber(breakEnd.x)} ${formatNumber(breakEnd.y)}`);
    commands.push(`L ${formatNumber(pathEnd.x)} ${formatNumber(pathEnd.y)}`);

    const anchors = {
      start: point(x1, y1),
      end: point(x2, y2),
      center: point((x1 + x2) / 2, (y1 + y2) / 2)
    };
    const node = svgElement("path", { d: commands.join(" "), fill: "none", ...lineVisualAttrs(this.params, { color: "black", strokeWidth: 0.6 }) });

    return { id: this.id, type: this.type, params: this.params, style: this.style, anchors, children: [], node };
  }
}

function automaticShelfLength(firstLine: string, fontSize: number, textInset: number, textWidthFactor: number): number {
  return roundSvg(textInset + firstLine.length * fontSize * textWidthFactor + 6);
}

function estimateTextWidth(text: string, fontSize: number, textWidthFactor: number): number {
  return text.length * fontSize * textWidthFactor;
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

function displayValue(value: ParamMap[string]): string {
  if (typeof value === "number") return formatDimensionValue(value);
  if (typeof value === "string") return value;
  return "";
}

function distributedLoadHeight(params: ParamMap): number | undefined {
  if (typeof params.height === "number") return params.height;

  const value = params.value;
  const heightScale = numberParam(params, "heightScale", Number.NaN);
  if (typeof value !== "number" || Number.isNaN(heightScale)) return undefined;

  const minHeight = numberParam(params, "minHeight", 0);
  return Math.max(minHeight, Math.abs(value) * heightScale);
}

function directionFromAngle(angle: number, directionSign: number): { x: number; y: number } {
  const radians = angle * (Math.PI / 180);
  return normalize({ x: Math.cos(radians) * directionSign, y: Math.sin(radians) * directionSign });
}

function forceVisibleLength(params: ParamMap): number {
  const explicitLength = numberParam(params, "length", Number.NaN);
  const minLength = Math.max(0, numberParam(params, "minLength", 0));
  const minVisibleLength = Math.max(0, numberParam(params, "minVisibleLength", 20));
  let calculatedLength = Number.NaN;

  if (!Number.isNaN(explicitLength)) {
    calculatedLength = Math.abs(explicitLength);
  } else if (typeof params.value === "number") {
    const lengthScale = numberParam(params, "lengthScale", Number.NaN);
    if (!Number.isNaN(lengthScale)) calculatedLength = Math.abs(params.value) * Math.abs(lengthScale);
  }

  if (Number.isNaN(calculatedLength)) calculatedLength = minVisibleLength;

  return roundSvg(Math.max(calculatedLength, minLength, minVisibleLength));
}

function forceLabelBase(
  textPosition: string,
  target: { x: number; y: number },
  tail: { x: number; y: number },
  mid: { x: number; y: number }
): { x: number; y: number } {
  if (textPosition === "tip") return target;
  if (textPosition === "middle") return mid;
  return tail;
}

function forceLabelDirection(
  textPlacement: string,
  axis: { x: number; y: number },
  normal: { x: number; y: number }
): { x: number; y: number } {
  if (textPlacement === "left") return normalize({ x: -normal.x, y: -normal.y });
  if (textPlacement === "right") return normalize(normal);
  if (textPlacement === "above") return { x: 0, y: -1 };
  if (textPlacement === "below") return { x: 0, y: 1 };
  if (textPlacement === "tail") return normalize({ x: -axis.x, y: -axis.y });
  if (textPlacement === "tip") return normalize(axis);

  const candidates = [normal, { x: -normal.x, y: -normal.y }];
  const preferred = candidates.reduce((best, candidate) => {
    if (candidate.y < best.y - 0.000001) return candidate;
    if (Math.abs(candidate.y - best.y) <= 0.000001 && candidate.x > best.x) return candidate;
    return best;
  });

  return normalize(preferred);
}

function readableTextAngle(angle: number): number {
  const normalized = normalizeAngle(angle);
  if (normalized > 90) return normalizeAngle(normalized - 180);
  if (normalized < -90) return normalizeAngle(normalized + 180);
  return normalized;
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
