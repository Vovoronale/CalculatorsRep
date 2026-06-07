import type { AnchorMap } from "./types";

export interface RectangleBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function rectangleAnchors(bounds: RectangleBounds): AnchorMap {
  const { x, y, width, height } = bounds;
  const midX = x + width / 2;
  const midY = y + height / 2;
  const right = x + width;
  const bottom = y + height;

  return {
    center: { x: midX, y: midY },
    top: { x: midX, y },
    bottom: { x: midX, y: bottom },
    left: { x, y: midY },
    right: { x: right, y: midY },
    topLeft: { x, y },
    topRight: { x: right, y },
    bottomLeft: { x, y: bottom },
    bottomRight: { x: right, y: bottom }
  };
}
