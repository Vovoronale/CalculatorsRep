import { describe, expect, it } from "vitest";

import { buildScene } from "../core/scene";
import { createDefaultRegistry } from "./defaultRegistry";

describe("LoadedFoundation", () => {
  it("renders a foundation body with depth, width, and R load label", () => {
    const built = buildScene(
      {
        scene: { width: 700, height: 520, mode: "detailed" },
        objects: {
          foundation: {
            type: "LoadedFoundation",
            params: {
              x: 180,
              y: 130,
              width: 320,
              depth: 170,
              loadValue: "R",
              color: "black",
              strokeWidth: 1.4,
            },
          },
        },
      },
      createDefaultRegistry(),
    );

    const foundation = built.objects.foundation;

    expect(foundation.anchors.ground).toEqual({ x: 340, y: 130 });
    expect(foundation.anchors.bottom).toEqual({ x: 340, y: 300 });
    expect(foundation.anchors.loadStart).toEqual({ x: 180, y: 362 });
    expect(foundation.anchors.loadEnd).toEqual({ x: 500, y: 362 });
    expect(foundation.children.map((child) => child.type)).toEqual([
      "Dimension",
      "Dimension",
      "RectBlock",
      "DistributedLoad",
    ]);
    expect(built.svg).toContain("d1=170");
    expect(built.svg).toContain("b=320");
    expect(built.svg).toContain(">R</text>");
    expect(built.svg).toContain("id=\"foundation-hatch\"");
    expect(built.svg).toContain("fill=\"url(#foundation-hatch)\"");
  });

  it("passes load prefix, suffix, and scaled height through the composed load", () => {
    const built = buildScene(
      {
        scene: { width: 520, height: 430, mode: "detailed" },
        objects: {
          foundation: {
            type: "LoadedFoundation",
            params: {
              x: 100,
              y: 80,
              width: 240,
              depth: 130,
              loadValue: 12,
              loadPrefix: "R=",
              loadSuffix: " кН",
              loadHeightScale: 3,
              loadMinHeight: 28,
            },
          },
        },
      },
      createDefaultRegistry(),
    );

    const foundation = built.objects.foundation;

    expect(built.svg).toContain(">R=12 кН</text>");
    expect(foundation.anchors.loadStart).toEqual({ x: 100, y: 272 });
    expect(foundation.anchors.loadEnd).toEqual({ x: 340, y: 272 });
    expect(foundation.children[2].params).toMatchObject({ height: 36 });
  });
});
