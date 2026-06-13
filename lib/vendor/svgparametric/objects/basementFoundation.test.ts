import { describe, expect, it } from "vitest";

import { buildScene } from "../core/scene";
import { createDefaultRegistry } from "./defaultRegistry";

describe("BasementFoundation", () => {
  it("renders a basement foundation with floor dimensions, break lines, and reaction load", () => {
    const built = buildScene(
      {
        scene: { width: 860, height: 560, mode: "detailed" },
        objects: {
          foundation: {
            type: "BasementFoundation",
            params: {
              x: 120,
              y: 90,
              width: 360,
              depth: 180,
              stemWidth: 84,
              basementWidth: 270,
              floorTopDepth: 120,
              floorThickness: 30,
              slabThickness: 24,
              upperWallWidth: 84,
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
    const childTypes = foundation.children.map((child) => child.type);

    expect(childTypes).toContain("RectBlock");
    expect(childTypes).toContain("Dimension");
    expect(childTypes).toContain("DistributedLoad");
    expect(childTypes).toContain("BreakLine");
    expect(built.svg).toContain("dB=120");
    expect(built.svg).toContain("h_cf=30");
    expect(built.svg).toContain("b=360");
    expect(foundation.anchors.floorTop).toEqual({ x: 612, y: 210 });
    expect(foundation.anchors.floorBottom).toEqual({ x: 612, y: 240 });
    expect(foundation.anchors.bottom).toEqual({ x: 300, y: 290.4 });
    expect(foundation.anchors.basementRight).toEqual({ x: 612, y: 150 });
  });

  it("moves the footing down when the basement floor depth increases", () => {
    const built = buildScene(
      {
        scene: { width: 900, height: 620, mode: "detailed" },
        objects: {
          shallow: {
            type: "BasementFoundation",
            params: {
              x: 120,
              y: 90,
              width: 360,
              depth: 180,
              stemWidth: 84,
              basementWidth: 270,
              floorTopDepth: 120,
              floorThickness: 30,
            },
          },
          deep: {
            type: "BasementFoundation",
            params: {
              x: 120,
              y: 90,
              width: 360,
              depth: 180,
              stemWidth: 84,
              basementWidth: 270,
              floorTopDepth: 170,
              floorThickness: 30,
            },
          },
        },
      },
      createDefaultRegistry(),
    );

    expect(built.objects.shallow.anchors.floorBottom.y).toBe(
      built.objects.shallow.anchors.baseTopLeft.y,
    );
    expect(built.objects.deep.anchors.floorBottom.y).toBe(
      built.objects.shallow.anchors.floorBottom.y + 50,
    );
    expect(built.objects.deep.anchors.baseTopLeft.y).toBe(
      built.objects.shallow.anchors.baseTopLeft.y + 50,
    );
    expect(built.objects.deep.anchors.bottom.y).toBe(
      built.objects.shallow.anchors.bottom.y + 50,
    );
  });
});
