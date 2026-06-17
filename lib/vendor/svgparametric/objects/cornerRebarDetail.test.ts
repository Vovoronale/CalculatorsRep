import { describe, expect, it } from "vitest";

import { buildScene } from "../core/scene";

import { createDefaultRegistry } from "./defaultRegistry";

describe("CornerRebarDetail", () => {
  it("uses the insertion point as the rebar center and exposes cover anchors", () => {
    const built = buildScene(
      {
        scene: { width: 700, height: 460, mode: "detailed" },
        objects: {
          detail: {
            type: "CornerRebarDetail",
            params: {
              x: 300,
              y: 220,
              rebarDiameter: 40,
              coverToCenter: 75,
              stirrupGap: 8,
              stirrupHorizontalLength: 240,
              stirrupVerticalLength: 180,
            },
          },
        },
      },
      createDefaultRegistry(),
    );

    const detail = built.objects.detail;

    expect(detail.anchors.center).toEqual({ x: 300, y: 220 });
    expect(detail.anchors.rebarLeft).toEqual({ x: 280, y: 220 });
    expect(detail.anchors.rebarRight).toEqual({ x: 320, y: 220 });
    expect(detail.anchors.concreteLeftFace).toEqual({ x: 225, y: 220 });
    expect(detail.anchors.concreteBottomFace).toEqual({ x: 300, y: 295 });
    expect(detail.anchors.stirrupInnerCorner).toEqual({ x: 272, y: 248 });
    expect(built.svg).toContain('id="detail"');
    expect(built.svg).toContain('data-role="concrete-left-face"');
    expect(built.svg).toContain('data-role="stirrup-outer-edge"');
  });

  it("builds cover and rebar radius dimension children", () => {
    const built = buildScene(
      {
        scene: { width: 700, height: 460, mode: "detailed" },
        objects: {
          detail: {
            type: "CornerRebarDetail",
            params: {
              x: 300,
              y: 220,
              rebarDiameter: 40,
              coverToCenter: 75,
              showDimensions: true,
            },
          },
        },
      },
      createDefaultRegistry(),
    );

    const dimensionChildren = built.objects.detail.children.filter((child) =>
      child.id.startsWith("detail.dimension."),
    );

    expect(dimensionChildren.map((child) => child.id)).toEqual([
      "detail.dimension.concreteToRebarEdge",
      "detail.dimension.rebarEdgeToCenter",
      "detail.dimension.coverToCenter",
    ]);
    expect(dimensionChildren[0]?.params).toMatchObject({ x1: 225, x2: 280 });
    expect(dimensionChildren[1]?.params).toMatchObject({ x1: 280, x2: 300 });
    expect(dimensionChildren[2]?.params).toMatchObject({ x1: 225, x2: 300 });
  });
});
