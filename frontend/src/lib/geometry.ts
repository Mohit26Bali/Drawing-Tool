import type { CanvasShape } from "@/types/canvas";

export interface Point {
  x: number;
  y: number;
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export interface Bounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function screenToWorld(point: Point, viewport: Viewport): Point {
  return {
    x: (point.x - viewport.x) / viewport.scale,
    y: (point.y - viewport.y) / viewport.scale,
  };
}

export function getShapeBounds(shape: CanvasShape): Bounds {
  switch (shape.type) {
    case "rectangle":
    case "ellipse":
      return {
        x1: shape.x,
        y1: shape.y,
        x2: shape.x + shape.width,
        y2: shape.y + shape.height,
      };
    case "text":
      return {
        x1: shape.x,
        y1: shape.y,
        x2: shape.x + shape.width,
        y2: shape.y + shape.fontSize * 1.4,
      };
    case "arrow":
    case "freehand": {
      const xs: number[] = [];
      const ys: number[] = [];
      for (let i = 0; i < shape.points.length; i += 2) {
        xs.push(shape.x + shape.points[i]);
        ys.push(shape.y + shape.points[i + 1]);
      }
      return { x1: Math.min(...xs), y1: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) };
    }
  }
}

export function boundsIntersect(a: Bounds, b: Bounds): boolean {
  return a.x1 <= b.x2 && a.x2 >= b.x1 && a.y1 <= b.y2 && a.y2 >= b.y1;
}

export function normalizeBounds(a: Point, b: Point): Bounds {
  return {
    x1: Math.min(a.x, b.x),
    y1: Math.min(a.y, b.y),
    x2: Math.max(a.x, b.x),
    y2: Math.max(a.y, b.y),
  };
}
