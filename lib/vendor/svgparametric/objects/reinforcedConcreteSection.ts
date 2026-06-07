import { rectangleAnchors } from "../core/anchors";
import { svgElement } from "../core/svg";
import type { AnchorMap, BuildContext, ObjectDefinition, ParamMap, ParametricObject, ResolvedObject } from "../core/types";
import { Callout, Dimension } from "./annotations";
import { booleanParam, lineVisualParams, numberParam, RectBlock, stringParam } from "./primitives";

interface VerticalPoint {
  key: string;
  y: number;
}

const REBAR_SIDE_INSET = 16;
const LEFT_CENTER_CHAIN_OFFSET = -65;
const RIGHT_REBAR_CHAIN_OFFSET = -55;
const RIGHT_TOTAL_HEIGHT_OFFSET = -75;
const BOTTOM_WIDTH_OFFSET = 45;

export class ReinforcedConcreteSection implements ParametricObject {
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
    const width = numberParam(this.params, "width", 300);
    const height = numberParam(this.params, "height", 420);
    const showTopRebar = booleanParam(this.params, "showTopRebar", true);
    const showBottomRebar = booleanParam(this.params, "showBottomRebar", true);
    const topDiameter = numberParam(this.params, "topDiameter", 16);
    const bottomDiameter = numberParam(this.params, "bottomDiameter", 16);
    const topCover = numberParam(this.params, "topCover", 30);
    const bottomCover = numberParam(this.params, "bottomCover", 30);
    const topAreaLabel = stringParam(this.params, "topAreaLabel", "A's");
    const bottomAreaLabel = stringParam(this.params, "bottomAreaLabel", "As");
    const legacyShowDimensions = booleanParam(this.params, "showDimensions", context.mode === "detailed" || context.mode === "debug");
    const showLeftCenterDimensions = booleanParam(this.params, "showLeftCenterDimensions", legacyShowDimensions);
    const showRightRebarDimensions = booleanParam(this.params, "showRightRebarDimensions", legacyShowDimensions);
    const showTotalHeightDimension = booleanParam(this.params, "showTotalHeightDimension", legacyShowDimensions);
    const showWidthDimension = booleanParam(this.params, "showWidthDimension", legacyShowDimensions);
    const bodyFill = stringParam(this.params, "bodyFill", "#dcebd2");
    const rebarFill = stringParam(this.params, "rebarFill", "#d8c4ff");
    const rebarColor = stringParam(this.params, "rebarColor", "#7a3ea0");
    const dimensionColor = stringParam(this.params, "dimensionColor", "#1e88ff");
    const calloutColor = stringParam(this.params, "calloutColor", "#e95a0c");
    const anchors = rectangleAnchors({ x, y, width, height });
    const visualParams = lineVisualParams(this.params, { color: "black", strokeWidth: 1.5 });
    const rebarX = x + REBAR_SIDE_INSET;
    const rebarWidth = Math.max(0, width - REBAR_SIDE_INSET * 2);
    const topRebarTop = y + topCover;
    const topRebarBottom = topRebarTop + topDiameter;
    const bottomRebarBottom = y + height - bottomCover;
    const bottomRebarTop = bottomRebarBottom - bottomDiameter;
    const topRebarCenter = { x: x + width / 2, y: topRebarTop + topDiameter / 2 };
    const bottomRebarCenter = { x: x + width / 2, y: bottomRebarTop + bottomDiameter / 2 };
    const hasVisibleRebar = showTopRebar || showBottomRebar;
    const childObjects: ParametricObject[] = [
      new RectBlock(`${this.id}.body`, {
        type: "RectBlock",
        params: {
          x,
          y,
          width,
          height,
          fill: bodyFill,
          hatch: { type: "diagonal", spacing: 10, color: "#9eb891", strokeWidth: 0.6 },
          ...visualParams
        }
      })
    ];

    if (showTopRebar) {
      childObjects.push(
        new RectBlock(`${this.id}.topRebar`, {
          type: "RectBlock",
          params: { x: rebarX, y: topRebarTop, width: rebarWidth, height: topDiameter, fill: rebarFill, color: rebarColor, strokeWidth: 1.5 }
        })
      );
    }

    if (showBottomRebar) {
      childObjects.push(
        new RectBlock(`${this.id}.bottomRebar`, {
          type: "RectBlock",
          params: { x: rebarX, y: bottomRebarTop, width: rebarWidth, height: bottomDiameter, fill: rebarFill, color: rebarColor, strokeWidth: 1.5 }
        })
      );
    }

    if (showTopRebar) {
      childObjects.push(
        new Callout(`${this.id}.topCallout`, {
          type: "Callout",
          params: {
            x1: topRebarCenter.x + rebarWidth * 0.25,
            y1: topRebarCenter.y,
            x2: x + width + 45,
            y2: y - 25,
            text: topAreaLabel,
            color: calloutColor,
            strokeWidth: 1.2
          }
        })
      );
    }

    if (showBottomRebar) {
      childObjects.push(
        new Callout(`${this.id}.bottomCallout`, {
          type: "Callout",
          params: {
            x1: bottomRebarCenter.x + rebarWidth * 0.3,
            y1: bottomRebarCenter.y,
            x2: x + width + 45,
            y2: y + height + 35,
            text: bottomAreaLabel,
            color: calloutColor,
            strokeWidth: 1.2
          }
        })
      );
    }

    if (showLeftCenterDimensions && hasVisibleRebar) {
      childObjects.push(
        ...leftCenterChainDimensions({
          id: this.id,
          x,
          y,
          height,
          showTopRebar,
          showBottomRebar,
          topRebarCenterY: topRebarCenter.y,
          bottomRebarCenterY: bottomRebarCenter.y,
          color: dimensionColor
        })
      );
    }

    if (showRightRebarDimensions && hasVisibleRebar) {
      childObjects.push(
        ...rightRebarChainDimensions({
          id: this.id,
          x: x + width,
          y,
          height,
          showTopRebar,
          showBottomRebar,
          topRebarTop,
          topRebarBottom,
          bottomRebarTop,
          bottomRebarBottom,
          color: dimensionColor
        })
      );
    }

    if (showTotalHeightDimension) {
      childObjects.push(
        new Dimension(`${this.id}.totalHeight`, {
          type: "Dimension",
          params: { x1: x + width, y1: y, x2: x + width, y2: y + height, offset: RIGHT_TOTAL_HEIGHT_OFFSET, color: dimensionColor, strokeWidth: 1 }
        })
      );
    }

    if (showWidthDimension) {
      childObjects.push(
        new Dimension(`${this.id}.width`, {
          type: "Dimension",
          params: { x1: x, y1: y + height, x2: x + width, y2: y + height, offset: BOTTOM_WIDTH_OFFSET, color: dimensionColor, strokeWidth: 1 }
        })
      );
    }

    const builtChildren = childObjects.map((child) => child.build(context));
    const resolvedAnchors: AnchorMap = { ...anchors };
    if (showTopRebar) resolvedAnchors.topRebarCenter = topRebarCenter;
    if (showBottomRebar) resolvedAnchors.bottomRebarCenter = bottomRebarCenter;
    const debugNodes =
      context.mode === "debug"
        ? Object.entries(resolvedAnchors).map(([name, point]) =>
            svgElement("circle", {
              cx: point.x,
              cy: point.y,
              r: 3,
              fill: "red",
              "data-anchor": name
            })
          )
        : [];

    this.anchors = resolvedAnchors;
    this.children = childObjects;

    return {
      id: this.id,
      type: this.type,
      params: this.params,
      style: this.style,
      anchors: resolvedAnchors,
      children: childObjects,
      node: svgElement("g", { id: this.id }, [...builtChildren.map((child) => child.node), ...debugNodes])
    };
  }
}

function leftCenterChainDimensions(params: {
  id: string;
  x: number;
  y: number;
  height: number;
  showTopRebar: boolean;
  showBottomRebar: boolean;
  topRebarCenterY: number;
  bottomRebarCenterY: number;
  color: string;
}): ParametricObject[] {
  const points: VerticalPoint[] = [{ key: "bottom", y: params.y + params.height }];
  if (params.showBottomRebar) points.push({ key: "bottomRebarCenter", y: params.bottomRebarCenterY });
  if (params.showTopRebar) points.push({ key: "topRebarCenter", y: params.topRebarCenterY });
  points.push({ key: "top", y: params.y });

  return chainDimensions({
    id: params.id,
    group: "leftCenterChain",
    x: params.x,
    points,
    offset: LEFT_CENTER_CHAIN_OFFSET,
    color: params.color
  });
}

function rightRebarChainDimensions(params: {
  id: string;
  x: number;
  y: number;
  height: number;
  showTopRebar: boolean;
  showBottomRebar: boolean;
  topRebarTop: number;
  topRebarBottom: number;
  bottomRebarTop: number;
  bottomRebarBottom: number;
  color: string;
}): ParametricObject[] {
  const points: VerticalPoint[] = [{ key: "top", y: params.y }];
  if (params.showTopRebar) {
    points.push({ key: "topRebarTop", y: params.topRebarTop }, { key: "topRebarBottom", y: params.topRebarBottom });
  }
  if (params.showBottomRebar) {
    points.push({ key: "bottomRebarTop", y: params.bottomRebarTop }, { key: "bottomRebarBottom", y: params.bottomRebarBottom });
  }
  points.push({ key: "bottom", y: params.y + params.height });

  return chainDimensions({
    id: params.id,
    group: "rightRebarChain",
    x: params.x,
    points,
    offset: RIGHT_REBAR_CHAIN_OFFSET,
    color: params.color
  });
}

function chainDimensions(params: {
  id: string;
  group: string;
  x: number;
  points: VerticalPoint[];
  offset: number;
  color: string;
}): ParametricObject[] {
  return params.points.slice(0, -1).map((point, index) => {
    const next = params.points[index + 1];
    return new Dimension(`${params.id}.${params.group}.${point.key}To${capitalize(next.key)}`, {
      type: "Dimension",
      params: { x1: params.x, y1: point.y, x2: params.x, y2: next.y, offset: params.offset, color: params.color, strokeWidth: 1 }
    });
  });
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
