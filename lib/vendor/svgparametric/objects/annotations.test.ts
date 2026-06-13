import { describe, expect, it } from "vitest";

import { Dimension } from "./annotations";

describe("Dimension", () => {
  it("moves overflowing horizontal dimension text to an outside shelf", () => {
    const dimension = new Dimension("dim", {
      type: "Dimension",
      params: {
        x1: 0,
        y1: 0,
        x2: 20,
        y2: 0,
        offset: -20,
        prefix: "length=",
        suffix: " mm",
        fontSize: 10,
      },
    });

    const built = dimension.build({ mode: "detailed", vars: {}, objects: {} });
    const children = built.node.children ?? [];

    expect(children).toHaveLength(8);
    expect(children[5]).toMatchObject({
      tag: "line",
      attrs: { x1: 10, y1: -20, x2: 32, y2: -42 },
    });
    expect(children[6]).toMatchObject({
      tag: "line",
      attrs: { x1: 32, y1: -42, x2: 89, y2: -42 },
    });
    expect(children[7]).toMatchObject({
      tag: "text",
      attrs: {
        x: 35,
        y: -48,
        "text-anchor": "start",
        transform: "rotate(0 35 -48)",
      },
      children: ["length=20 mm"],
    });
    expect(built.anchors.label).toEqual({ x: 35, y: -48 });
  });
});
