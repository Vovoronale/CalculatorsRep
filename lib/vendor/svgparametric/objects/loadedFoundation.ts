import { svgElement } from "../core/svg";
import type { AnchorMap, BuildContext, ObjectDefinition, ParamMap, ParametricObject, ResolvedObject } from "../core/types";
import { Dimension, DistributedLoad } from "./annotations";
import {
  effectiveLoadHeight,
  foundationGeometry,
  foundationHatchPattern,
  foundationPath,
  groundNodes,
  point,
  sanitizeSvgId
} from "./foundationDiagram";
import { booleanParam, lineVisualAttrs, lineVisualParams, numberParam, RectBlock, stringParam } from "./primitives";

export class LoadedFoundation implements ParametricObject {
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
    const geometry = foundationGeometry(this.params);
    const { x, groundY, width, depth, baseHeight, stemWidth, stemHeightAboveGround, bottomY, baseTopY, stemLeft, stemRight, stemTopY, centerX } = geometry;
    const depthDimensionOffset = numberParam(this.params, "depthDimensionOffset", Math.max(32, width * 0.1));
    const widthDimensionOffset = numberParam(this.params, "widthDimensionOffset", 34);
    const depthDimensionScale = numberParam(this.params, "depthDimensionScale", 1);
    const widthDimensionScale = numberParam(this.params, "widthDimensionScale", 1);
    const dimensionSuffix = stringParam(this.params, "dimensionSuffix", "");
    const loadGap = numberParam(this.params, "loadGap", widthDimensionOffset + 28);
    const loadHeight = effectiveLoadHeight(this.params, 34);
    const loadValue = loadValueParam(this.params, "loadValue", "R");
    const loadPrefix = stringParam(this.params, "loadPrefix", "");
    const loadSuffix = stringParam(this.params, "loadSuffix", "");
    const showDimensions = booleanParam(this.params, "showDimensions", context.mode === "detailed" || context.mode === "debug");
    const showLoad = booleanParam(this.params, "showLoad", context.mode === "detailed" || context.mode === "debug");
    const showGround = booleanParam(this.params, "showGround", true);
    const hatch = booleanParam(this.params, "hatch", true);
    const fill = stringParam(this.params, "fill", "#e6e6e6");
    const hatchColor = stringParam(this.params, "hatchColor", "#b8b8b8");
    const hatchSpacing = numberParam(this.params, "hatchSpacing", 12);
    const hatchStrokeWidth = numberParam(this.params, "hatchStrokeWidth", 1);
    const loadFill = stringParam(this.params, "loadFill", "#f3cccc");
    const loadColor = stringParam(this.params, "loadColor", "#b54a4a");
    const loadTopY = bottomY + loadGap;
    const visualParams = lineVisualParams(this.params, { color: "black", strokeWidth: 1.4 });
    const anchors = {
      ground: point(centerX, groundY),
      top: point(centerX, stemTopY),
      bottom: point(centerX, bottomY),
      center: point(centerX, (stemTopY + bottomY) / 2),
      left: point(x, baseTopY + baseHeight / 2),
      right: point(x + width, baseTopY + baseHeight / 2),
      stemTopLeft: point(stemLeft, stemTopY),
      stemTopRight: point(stemRight, stemTopY),
      baseTopLeft: point(x, baseTopY),
      baseTopRight: point(x + width, baseTopY),
      bottomLeft: point(x, bottomY),
      bottomRight: point(x + width, bottomY),
      loadStart: point(x, loadTopY),
      loadEnd: point(x + width, loadTopY)
    };
    const childObjects: ParametricObject[] = [];
    const hatchId = `${sanitizeSvgId(this.id)}-hatch`;
    const nodes = [
      ...(hatch ? [foundationHatchPattern(hatchId, fill, hatchColor, hatchSpacing, hatchStrokeWidth)] : []),
      svgElement("path", {
        d: foundationPath(geometry),
        fill: hatch ? `url(#${hatchId})` : fill,
        ...lineVisualAttrs(this.params, { color: "black", strokeWidth: 1.4 })
      })
    ];

    if (showGround) {
      nodes.unshift(...groundNodes(geometry, visualParams));
    }

    if (showDimensions) {
      childObjects.push(
        new Dimension(`${this.id}.dimension.depth`, {
          type: "Dimension",
          params: { x1: x, y1: groundY, x2: x, y2: bottomY, offset: depthDimensionOffset, scale: depthDimensionScale, prefix: "d1=", suffix: dimensionSuffix, ...visualParams }
        }),
        new Dimension(`${this.id}.dimension.width`, {
          type: "Dimension",
          params: { x1: x, y1: bottomY, x2: x + width, y2: bottomY, offset: widthDimensionOffset, scale: widthDimensionScale, prefix: "b=", suffix: dimensionSuffix, ...visualParams }
        })
      );
    }

    if (showLoad) {
      childObjects.push(
        new RectBlock(`${this.id}.load.band`, {
          type: "RectBlock",
          params: { x, y: loadTopY, width, height: loadHeight, fill: loadFill, color: loadColor, strokeWidth: 1.2 }
        }),
        new DistributedLoad(`${this.id}.load`, {
          type: "DistributedLoad",
          params: {
            x1: x,
            y1: loadTopY,
            x2: x + width,
            y2: loadTopY,
            offset: loadHeight,
            arrowSpacing: width / 5,
            arrowSize: 10,
            textOffset: 18,
            value: loadValue,
            prefix: loadPrefix,
            suffix: loadSuffix,
            color: loadColor,
            strokeWidth: 1.8
          }
        })
      );
    }

    const builtChildren = childObjects.map((child) => child.build(context));
    const debugNodes =
      context.mode === "debug"
        ? Object.entries(anchors).map(([name, anchor]) =>
            svgElement("circle", { cx: anchor.x, cy: anchor.y, r: 3, fill: "red", "data-anchor": name })
          )
        : [];

    this.anchors = anchors;
    this.children = childObjects;

    return {
      id: this.id,
      type: this.type,
      params: this.params,
      style: this.style,
      anchors,
      children: childObjects,
      node: svgElement("g", { id: this.id }, [...nodes, ...builtChildren.map((child) => child.node), ...debugNodes])
    };
  }
}

function loadValueParam(params: ParamMap, key: string, fallback: string): string | number {
  const value = params[key];
  return typeof value === "number" || typeof value === "string" ? value : fallback;
}
