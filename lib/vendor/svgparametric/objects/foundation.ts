import { rectangleAnchors } from "../core/anchors";
import { svgElement } from "../core/svg";
import type { AnchorMap, BuildContext, ObjectDefinition, ParamMap, ParametricObject, ResolvedObject } from "../core/types";
import { Dimension } from "./annotations";
import { booleanParam, lineVisualParams, numberParam, RectBlock, stringParam, TextLabel } from "./primitives";

export class Foundation implements ParametricObject {
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
    const width = numberParam(this.params, "width", 400);
    const height = numberParam(this.params, "height", 160);
    const label = stringParam(this.params, "label", "");
    const showDimensions = booleanParam(this.params, "showDimensions", context.mode === "detailed" || context.mode === "debug");
    const anchors = rectangleAnchors({ x, y, width, height });
    const visualParams = lineVisualParams(this.params, { color: "black", strokeWidth: 2 });

    const childObjects: ParametricObject[] = [
      new RectBlock(`${this.id}.body`, {
        type: "RectBlock",
        params: { x, y, width, height, fill: "none", ...visualParams }
      })
    ];

    if (label && context.mode !== "simple") {
      childObjects.push(
        new TextLabel(`${this.id}.label`, {
          type: "TextLabel",
          params: { x: anchors.center.x, y: anchors.center.y, text: label, fontSize: 14, textAnchor: "middle" }
        })
      );
    }

    if (showDimensions) {
      childObjects.push(
        new Dimension(`${this.id}.dimension.width`, {
          type: "Dimension",
          params: { x1: x, y1: y + height, x2: x + width, y2: y + height, offset: 30, scale: 1, ...visualParams }
        })
      );
    }

    const builtChildren = childObjects.map((child) => child.build(context));
    const debugNodes =
      context.mode === "debug"
        ? Object.entries(anchors).map(([name, point]) =>
            svgElement("circle", {
              cx: point.x,
              cy: point.y,
              r: 3,
              fill: "red",
              "data-anchor": name
            })
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
      node: svgElement("g", { id: this.id }, [...builtChildren.map((child) => child.node), ...debugNodes])
    };
  }
}
