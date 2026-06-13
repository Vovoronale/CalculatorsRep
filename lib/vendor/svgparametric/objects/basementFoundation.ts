import { svgElement } from "../core/svg";
import type { AnchorMap, BuildContext, ObjectDefinition, ParamMap, ParametricObject, ResolvedObject } from "../core/types";
import { BreakLine, Dimension, DistributedLoad } from "./annotations";
import {
  effectiveLoadHeight,
  foundationGeometry,
  foundationHatchPattern,
  foundationPath,
  point,
  roundSvg,
  sanitizeSvgId
} from "./foundationDiagram";
import { booleanParam, lineVisualAttrs, lineVisualParams, numberParam, RectBlock, stringParam } from "./primitives";

export class BasementFoundation implements ParametricObject {
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
    const rawDepth = numberParam(this.params, "depth", 170);
    const floorThickness = numberParam(this.params, "floorThickness", 24);
    const baseHeight = numberParam(this.params, "baseHeight", rawDepth * 0.28);
    const floorTopDepth = numberParam(this.params, "floorTopDepth", rawDepth - baseHeight - floorThickness);
    const stemHeightAboveGround = numberParam(this.params, "stemHeightAboveGround", rawDepth * 0.4);
    const geometry = foundationGeometry({ ...this.params, depth: floorTopDepth + floorThickness + baseHeight, baseHeight, stemHeightAboveGround });
    const { x, groundY, width, bottomY, baseTopY, stemLeft, stemRight, stemTopY, centerX } = geometry;
    const basementWidth = numberParam(this.params, "basementWidth", width);
    const slabThickness = numberParam(this.params, "slabThickness", 24);
    const upperWallWidth = numberParam(this.params, "upperWallWidth", geometry.stemWidth);
    const upperWallHeight = numberParam(this.params, "upperWallHeight", geometry.stemHeightAboveGround);
    const dimensionChainOffset = numberParam(this.params, "dimensionChainOffset", -76);
    const depthDimensionOffset = numberParam(this.params, "depthDimensionOffset", dimensionChainOffset);
    const floorDimensionOffset = numberParam(this.params, "floorDimensionOffset", dimensionChainOffset);
    const baseHeightDimensionOffset = numberParam(this.params, "baseHeightDimensionOffset", dimensionChainOffset);
    const widthDimensionOffset = numberParam(this.params, "widthDimensionOffset", 34);
    const widthDimensionScale = numberParam(this.params, "widthDimensionScale", 1);
    const baseHeightDimensionScale = numberParam(this.params, "baseHeightDimensionScale", 1);
    const floorTopDepthDimensionScale = numberParam(this.params, "floorTopDepthDimensionScale", 1);
    const floorThicknessDimensionScale = numberParam(this.params, "floorThicknessDimensionScale", 1);
    const dimensionSuffix = stringParam(this.params, "dimensionSuffix", "");
    const loadGap = numberParam(this.params, "loadGap", widthDimensionOffset + 28);
    const loadHeight = effectiveLoadHeight(this.params, 34);
    const loadValue = loadValueParam(this.params, "loadValue", "R");
    const loadPrefix = stringParam(this.params, "loadPrefix", "");
    const loadSuffix = stringParam(this.params, "loadSuffix", "");
    const showDimensions = booleanParam(this.params, "showDimensions", context.mode === "detailed" || context.mode === "debug");
    const showFloorDimensions = booleanParam(this.params, "showFloorDimensions", showDimensions);
    const showBasementDimensions = booleanParam(this.params, "showBasementDimensions", showDimensions);
    const showLoad = booleanParam(this.params, "showLoad", context.mode === "detailed" || context.mode === "debug");
    const showGround = booleanParam(this.params, "showGround", true);
    const showBreakLines = booleanParam(this.params, "showBreakLines", true);
    const hatch = booleanParam(this.params, "hatch", true);
    const fill = stringParam(this.params, "fill", "#e6e6e6");
    const hatchColor = stringParam(this.params, "hatchColor", "#b8b8b8");
    const hatchSpacing = numberParam(this.params, "hatchSpacing", 12);
    const hatchStrokeWidth = numberParam(this.params, "hatchStrokeWidth", 1);
    const loadFill = stringParam(this.params, "loadFill", "#f3cccc");
    const loadColor = stringParam(this.params, "loadColor", "#b54a4a");
    const slabFill = stringParam(this.params, "slabFill", "#eef7e8");
    const slabColor = stringParam(this.params, "slabColor", "#5f8f43");
    const upperWallColor = stringParam(this.params, "upperWallColor", "#d56a00");
    const basementRight = stemRight + basementWidth;
    const floorTopY = groundY + floorTopDepth;
    const floorBottomY = floorTopY + floorThickness;
    const slabX = centerX;
    const slabTopY = stemTopY - slabThickness;
    const slabBottomY = stemTopY;
    const slabWidth = basementRight - slabX;
    const upperWallX = centerX - upperWallWidth / 2;
    const upperWallY = stemTopY - upperWallHeight;
    const loadTopY = bottomY + loadGap;
    const visualParams = lineVisualParams(this.params, { color: "black", strokeWidth: 1.4 });
    const upperWallAttrs = lineVisualAttrs({ color: upperWallColor, strokeWidth: 1.4 }, { color: "black", strokeWidth: 1.4 });
    const anchors = {
      ground: point(centerX, groundY),
      top: point(centerX, stemTopY),
      bottom: point(centerX, bottomY),
      center: point(centerX, (stemTopY + bottomY) / 2),
      stemTopLeft: point(stemLeft, stemTopY),
      stemTopRight: point(stemRight, stemTopY),
      baseTopLeft: point(x, baseTopY),
      baseTopRight: point(x + width, baseTopY),
      bottomLeft: point(x, bottomY),
      bottomRight: point(x + width, bottomY),
      basementRight: point(basementRight, (groundY + floorTopY) / 2),
      floorTop: point(basementRight, floorTopY),
      floorBottom: point(basementRight, floorBottomY),
      slabTop: point(basementRight, slabTopY),
      slabBottom: point(basementRight, slabBottomY),
      loadStart: point(x, loadTopY),
      loadEnd: point(x + width, loadTopY)
    };
    const childObjects: ParametricObject[] = [
      new RectBlock(`${this.id}.slab`, {
        type: "RectBlock",
        params: { x: slabX, y: slabTopY, width: slabWidth, height: slabThickness, fill: slabFill, color: slabColor, strokeWidth: 1.4 }
      }),
      new RectBlock(`${this.id}.floor`, {
        type: "RectBlock",
        params: { x: stemRight, y: floorTopY, width: basementWidth, height: floorThickness, fill: slabFill, color: slabColor, strokeWidth: 1.4 }
      })
    ];
    const hatchId = `${sanitizeSvgId(this.id)}-hatch`;
    const nodes = [
      ...(hatch ? [foundationHatchPattern(hatchId, fill, hatchColor, hatchSpacing, hatchStrokeWidth)] : []),
      svgElement("path", {
        d: foundationPath(geometry),
        fill: hatch ? `url(#${hatchId})` : fill,
        ...lineVisualAttrs(this.params, { color: "black", strokeWidth: 1.4 })
      }),
      ...openTopWallNodes(upperWallX, upperWallY, upperWallWidth, upperWallHeight, upperWallAttrs)
    ];

    if (showGround) {
      nodes.unshift(...leftGroundNodes(geometry, visualParams));
    }

    if (showDimensions) {
      childObjects.push(
        new Dimension(`${this.id}.dimension.width`, {
          type: "Dimension",
          params: { x1: x, y1: bottomY, x2: x + width, y2: bottomY, offset: widthDimensionOffset, scale: widthDimensionScale, prefix: "b=", suffix: dimensionSuffix, ...visualParams }
        }),
        new Dimension(`${this.id}.dimension.baseHeight`, {
          type: "Dimension",
          params: { x1: basementRight, y1: roundSvg(baseTopY), x2: basementRight, y2: roundSvg(bottomY), offset: baseHeightDimensionOffset, scale: baseHeightDimensionScale, prefix: "h_p=", suffix: dimensionSuffix, ...visualParams }
        })
      );
    }

    if (showBasementDimensions) {
      childObjects.push(
        new Dimension(`${this.id}.dimension.floorTopDepth`, {
          type: "Dimension",
          params: { x1: basementRight, y1: groundY, x2: basementRight, y2: floorTopY, offset: depthDimensionOffset, scale: floorTopDepthDimensionScale, prefix: "dB=", suffix: dimensionSuffix, ...visualParams }
        })
      );
    }

    if (showFloorDimensions) {
      childObjects.push(
        new Dimension(`${this.id}.dimension.floorThickness`, {
          type: "Dimension",
          params: { x1: basementRight, y1: floorTopY, x2: basementRight, y2: floorBottomY, offset: floorDimensionOffset, scale: floorThicknessDimensionScale, prefix: "h_cf=", suffix: dimensionSuffix, ...visualParams }
        })
      );
    }

    if (showBreakLines) {
      childObjects.push(
        new BreakLine(`${this.id}.upperWallBreak`, {
          type: "BreakLine",
          params: { x1: upperWallX, y1: upperWallY, x2: upperWallX + upperWallWidth, y2: upperWallY, amplitude: 8, waveCount: 1, color: upperWallColor, strokeWidth: 1.4 }
        }),
        new BreakLine(`${this.id}.basementBreak`, {
          type: "BreakLine",
          params: { x1: basementRight, y1: slabTopY, x2: basementRight, y2: floorBottomY, amplitude: 8, waveCount: 1, color: slabColor, strokeWidth: 1.4 }
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

function openTopWallNodes(x: number, y: number, width: number, height: number, attrs: Record<string, string | number | boolean | undefined>) {
  return [
    svgElement("line", { x1: roundSvg(x), y1: roundSvg(y), x2: roundSvg(x), y2: roundSvg(y + height), ...attrs }),
    svgElement("line", { x1: roundSvg(x + width), y1: roundSvg(y), x2: roundSvg(x + width), y2: roundSvg(y + height), ...attrs }),
    svgElement("line", { x1: roundSvg(x), y1: roundSvg(y + height), x2: roundSvg(x + width), y2: roundSvg(y + height), ...attrs })
  ];
}

function leftGroundNodes(geometry: ReturnType<typeof foundationGeometry>, visualParams: ParamMap) {
  const { x, groundY, stemLeft } = geometry;
  const extension = 40;
  const hatchSpacing = 16;
  const hatchLength = 10;
  const attrs = lineVisualAttrs(visualParams, { color: "black", strokeWidth: 1.4 });
  const nodes = [svgElement("line", { x1: x - extension, y1: groundY, x2: stemLeft, y2: groundY, ...attrs })];

  for (let hx = x - extension + hatchSpacing; hx < stemLeft - 4; hx += hatchSpacing) {
    nodes.push(svgElement("line", { x1: roundSvg(hx), y1: groundY, x2: roundSvg(hx - hatchLength), y2: roundSvg(groundY + hatchLength), ...attrs }));
  }

  return nodes;
}

function loadValueParam(params: ParamMap, key: string, fallback: string): string | number {
  const value = params[key];
  return typeof value === "number" || typeof value === "string" ? value : fallback;
}
