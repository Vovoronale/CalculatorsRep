import { svgElement } from "../core/svg";
import type { AnchorMap, BuildContext, ObjectDefinition, ParamMap, ParametricObject, ResolvedObject } from "../core/types";
import { Dimension } from "./annotations";
import { booleanParam, lineVisualAttrs, numberParam, Point, stringParam } from "./primitives";

export class CornerRebarDetail implements ParametricObject {
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

  build(context: BuildContext): ResolvedObject {
    const x = numberParam(this.params, "x", 0);
    const y = numberParam(this.params, "y", 0);
    const rebarDiameter = Math.max(0, numberParam(this.params, "rebarDiameter", 32));
    const rebarRadius = rebarDiameter / 2;
    const coverToCenter = numberParam(this.params, "coverToCenter", 60);
    const stirrupDiameter = Math.max(0.1, numberParam(this.params, "stirrupDiameter", 8));
    const stirrupGap = numberParam(this.params, "stirrupGap", 6);
    const stirrupHorizontalLength = numberParam(this.params, "stirrupHorizontalLength", 260);
    const stirrupVerticalLength = numberParam(this.params, "stirrupVerticalLength", 180);
    const stirrupBendRadius = Math.max(0, numberParam(this.params, "stirrupBendRadius", 26));
    const concreteTopExtension = numberParam(this.params, "concreteTopExtension", 220);
    const concreteRightExtension = numberParam(this.params, "concreteRightExtension", Math.max(stirrupHorizontalLength + rebarRadius + 55, 280));
    const dimensionOffset = numberParam(this.params, "dimensionOffset", 50);
    const secondDimensionOffset = numberParam(this.params, "secondDimensionOffset", dimensionOffset + 42);
    const showDimensions = booleanParam(this.params, "showDimensions", context.mode === "detailed" || context.mode === "debug");
    const showCoverDimension = booleanParam(this.params, "showCoverDimension", showDimensions);
    const showRebarRadiusDimension = booleanParam(this.params, "showRebarRadiusDimension", showDimensions);
    const showConcreteToRebarEdgeDimension = booleanParam(this.params, "showConcreteToRebarEdgeDimension", showDimensions);
    const concreteColor = stringParam(this.params, "concreteColor", "black");
    const breakColor = stringParam(this.params, "breakColor", "#777777");
    const stirrupColor = stringParam(this.params, "stirrupColor", "#e95a0c");
    const stirrupFill = stringParam(this.params, "stirrupFill", "#ffe4d2");
    const rebarFill = stringParam(this.params, "rebarFill", "#c64df4");
    const rebarColor = stringParam(this.params, "rebarColor", "black");
    const dimensionColor = stringParam(this.params, "dimensionColor", concreteColor);
    const concreteLeftX = x - coverToCenter;
    const concreteBottomY = y + coverToCenter;
    const concreteTopY = concreteBottomY - concreteTopExtension;
    const concreteRightX = x + concreteRightExtension;
    const clipExtensionRightX = concreteRightX + 60;
    const stirrupAxisX = x - rebarRadius - stirrupGap;
    const stirrupAxisY = y + rebarRadius + stirrupGap;
    const stirrupHorizontalEndX = x + stirrupHorizontalLength;
    const stirrupDrawEndX = Math.max(stirrupHorizontalEndX, clipExtensionRightX);
    const stirrupVerticalEndY = stirrupAxisY - stirrupVerticalLength;
    const anchors: AnchorMap = {
      center: point(x, y),
      rebarLeft: point(x - rebarRadius, y),
      rebarRight: point(x + rebarRadius, y),
      rebarTop: point(x, y - rebarRadius),
      rebarBottom: point(x, y + rebarRadius),
      concreteLeftFace: point(concreteLeftX, y),
      concreteBottomFace: point(x, concreteBottomY),
      stirrupInnerCorner: point(stirrupAxisX, stirrupAxisY),
      stirrupVerticalEnd: point(stirrupAxisX, stirrupVerticalEndY),
      stirrupHorizontalEnd: point(stirrupHorizontalEndX, stirrupAxisY)
    };
    const childObjects: ParametricObject[] = [
      new Point(`${this.id}.rebar`, {
        type: "Point",
        params: { x, y, diameter: rebarDiameter, fill: rebarFill, color: rebarColor, strokeWidth: Math.max(1.5, stirrupDiameter * 0.55) }
      })
    ];

    if (showConcreteToRebarEdgeDimension) {
      childObjects.push(
        new Dimension(`${this.id}.dimension.concreteToRebarEdge`, {
          type: "Dimension",
          params: {
            x1: concreteLeftX,
            y1: concreteBottomY,
            x2: x - rebarRadius,
            y2: concreteBottomY,
            offset: dimensionOffset,
            color: dimensionColor,
            strokeWidth: 0.8
          }
        })
      );
    }

    if (showRebarRadiusDimension) {
      childObjects.push(
        new Dimension(`${this.id}.dimension.rebarEdgeToCenter`, {
          type: "Dimension",
          params: {
            x1: x - rebarRadius,
            y1: concreteBottomY,
            x2: x,
            y2: concreteBottomY,
            offset: dimensionOffset,
            prefix: "d/2=",
            labelPlacement: "end",
            color: dimensionColor,
            strokeWidth: 0.8
          }
        })
      );
    }

    if (showCoverDimension) {
      childObjects.push(
        new Dimension(`${this.id}.dimension.coverToCenter`, {
          type: "Dimension",
          params: {
            x1: concreteLeftX,
            y1: concreteBottomY,
            x2: x,
            y2: concreteBottomY,
            offset: secondDimensionOffset,
            prefix: "a=",
            color: dimensionColor,
            strokeWidth: 0.8
          }
        })
      );
    }

    const builtChildren = childObjects.map((child) => child.build(context));
    const debugNodes =
      context.mode === "debug"
        ? Object.entries(anchors).map(([name, anchor]) => svgElement("circle", { cx: anchor.x, cy: anchor.y, r: 3, fill: "red", "data-anchor": name }))
        : [];

    this.anchors = anchors;
    this.children = childObjects;

    const clipId = `${sanitizeSvgId(this.id)}-clip`;
    const breakGeometry = concreteBreakGeometry(concreteLeftX, concreteTopY, concreteBottomY, concreteRightX);
    const clippedNodes = [
      ...concreteNodes(concreteLeftX, concreteTopY, concreteBottomY, clipExtensionRightX, concreteColor),
      ...stirrupNodes(stirrupAxisX, stirrupAxisY, stirrupVerticalEndY, stirrupDrawEndX, stirrupBendRadius, stirrupDiameter, stirrupColor, stirrupFill),
      builtChildren[0]?.node
    ].filter((node) => node !== undefined);

    return {
      id: this.id,
      type: this.type,
      params: this.params,
      style: this.style,
      anchors,
      children: childObjects,
      node: svgElement("g", { id: this.id }, [
        svgElement("defs", {}, [svgElement("clipPath", { id: clipId }, [svgElement("path", { d: breakGeometry.clipPath })])]),
        svgElement("g", { "clip-path": `url(#${clipId})` }, clippedNodes),
        svgElement("path", { d: breakGeometry.breakPath, fill: "none", ...lineVisualAttrs({ color: breakColor, strokeWidth: 1.4 }) }),
        ...builtChildren.slice(1).map((child) => child.node),
        ...debugNodes
      ])
    };
  }
}

function concreteNodes(leftX: number, topY: number, bottomY: number, rightX: number, concreteColor: string) {
  const attrs = lineVisualAttrs({ color: concreteColor, strokeWidth: 2.2 });

  return [
    svgElement("line", { x1: leftX, y1: topY, x2: leftX, y2: bottomY, ...attrs, "data-role": "concrete-left-face" }),
    svgElement("line", { x1: leftX, y1: bottomY, x2: rightX, y2: bottomY, ...attrs, "data-role": "concrete-bottom-face" })
  ];
}

function concreteBreakGeometry(leftX: number, topY: number, bottomY: number, rightX: number) {
  const breakEndX = rightX + 18;
  const breakEndY = bottomY + 22;
  const breakPath = [
    `M ${formatNumber(leftX)} ${formatNumber(topY)}`,
    `C ${formatNumber(leftX + 55)} ${formatNumber(topY + 8)}, ${formatNumber(leftX + 88)} ${formatNumber(topY + 39)}, ${formatNumber(leftX + 128)} ${formatNumber(topY + 48)}`,
    `C ${formatNumber(leftX + 220)} ${formatNumber(topY + 66)}, ${formatNumber(leftX + 282)} ${formatNumber(bottomY - 100)}, ${formatNumber(leftX + 365)} ${formatNumber(bottomY - 76)}`,
    `C ${formatNumber(leftX + 448)} ${formatNumber(bottomY - 54)}, ${formatNumber(rightX - 22)} ${formatNumber(bottomY - 40)}, ${formatNumber(breakEndX)} ${formatNumber(breakEndY)}`
  ].join(" ");
  const clipPath = [
    breakPath,
    `L ${formatNumber(rightX + 40)} ${formatNumber(bottomY + 60)}`,
    `L ${formatNumber(leftX)} ${formatNumber(bottomY + 60)}`,
    `L ${formatNumber(leftX)} ${formatNumber(topY)}`,
    "Z"
  ].join(" ");

  return { breakPath, clipPath };
}

function stirrupNodes(
  axisX: number,
  axisY: number,
  verticalEndY: number,
  horizontalEndX: number,
  bendRadius: number,
  stirrupDiameter: number,
  color: string,
  fill: string
) {
  const half = stirrupDiameter / 2;
  const radius = Math.min(bendRadius, Math.max(0, axisY - verticalEndY - half), Math.max(0, horizontalEndX - axisX - half));
  const outerPath = [
    `M ${formatNumber(axisX - half)} ${formatNumber(verticalEndY)}`,
    `L ${formatNumber(axisX - half)} ${formatNumber(axisY - radius)}`,
    `Q ${formatNumber(axisX - half)} ${formatNumber(axisY + half)} ${formatNumber(axisX + radius)} ${formatNumber(axisY + half)}`,
    `L ${formatNumber(horizontalEndX)} ${formatNumber(axisY + half)}`
  ].join(" ");
  const innerPath = [
    `M ${formatNumber(axisX + half)} ${formatNumber(verticalEndY)}`,
    `L ${formatNumber(axisX + half)} ${formatNumber(axisY - radius)}`,
    `Q ${formatNumber(axisX + half)} ${formatNumber(axisY - half)} ${formatNumber(axisX + radius)} ${formatNumber(axisY - half)}`,
    `L ${formatNumber(horizontalEndX)} ${formatNumber(axisY - half)}`
  ].join(" ");
  const fillPath = [
    outerPath,
    `L ${formatNumber(horizontalEndX)} ${formatNumber(axisY - half)}`,
    `L ${formatNumber(axisX + radius)} ${formatNumber(axisY - half)}`,
    `Q ${formatNumber(axisX + half)} ${formatNumber(axisY - half)} ${formatNumber(axisX + half)} ${formatNumber(axisY - radius)}`,
    `L ${formatNumber(axisX + half)} ${formatNumber(verticalEndY)}`,
    "Z"
  ].join(" ");
  const edgeAttrs = lineVisualAttrs({ color, strokeWidth: Math.max(1.8, stirrupDiameter * 0.32) });

  return [
    svgElement("path", { d: fillPath, fill, stroke: "none", "data-role": "stirrup-fill" }),
    svgElement("path", { d: outerPath, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round", "data-role": "stirrup-outer-edge", ...edgeAttrs }),
    svgElement("path", { d: innerPath, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round", "data-role": "stirrup-inner-edge", ...edgeAttrs })
  ];
}

function sanitizeSvgId(value: string): string {
  const id = value.replace(/[^A-Za-z0-9_-]/g, "_");
  return id || "corner-rebar-detail";
}

function point(x: number, y: number) {
  return { x: roundSvg(x), y: roundSvg(y) };
}

function formatNumber(value: number): string {
  return String(roundSvg(value));
}

function roundSvg(value: number): number {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}
