import type { CanvasShape, ShapeType } from "@/types/canvas";
import type { Point } from "@/lib/geometry";

export interface ShapeStyle {
  stroke: string;
  fill: string;
  strokeWidth: number;
}

export function createShape(
  type: ShapeType,
  x: number,
  y: number,
  style: ShapeStyle
): CanvasShape {
  const base = {
    id: crypto.randomUUID(),
    x,
    y,
    rotation: 0,
    stroke: style.stroke,
    fill: style.fill,
    strokeWidth: style.strokeWidth,
  };

  switch (type) {
    case "rectangle":
      return { ...base, type: "rectangle", width: 0, height: 0 };
    case "ellipse":
      return { ...base, type: "ellipse", width: 0, height: 0 };
    case "arrow":
      return { ...base, type: "arrow", points: [0, 0, 0, 0] };
    case "freehand":
      return { ...base, type: "freehand", points: [0, 0] };
    case "text":
      return { ...base, type: "text", text: "", width: 200, fontSize: 20 };
  }
}

export function extendDraftShape(shape: CanvasShape, start: Point, current: Point): CanvasShape {
  switch (shape.type) {
    case "rectangle":
    case "ellipse":
      return { ...shape, width: current.x - start.x, height: current.y - start.y };
    case "arrow":
      return { ...shape, points: [0, 0, current.x - start.x, current.y - start.y] };
    case "freehand":
      return { ...shape, points: [...shape.points, current.x - start.x, current.y - start.y] };
    default:
      return shape;
  }
}

export function normalizeDraftShape(shape: CanvasShape): CanvasShape {
  if (shape.type === "rectangle" || shape.type === "ellipse") {
    let { x, y, width, height } = shape;
    if (width < 0) {
      x += width;
      width = -width;
    }
    if (height < 0) {
      y += height;
      height = -height;
    }
    return { ...shape, x, y, width, height };
  }
  return shape;
}

export function isMeaningfulShape(shape: CanvasShape): boolean {
  if (shape.type === "rectangle" || shape.type === "ellipse") {
    return shape.width > 2 && shape.height > 2;
  }
  if (shape.type === "arrow") {
    return Math.hypot(shape.points[2] - shape.points[0], shape.points[3] - shape.points[1]) > 2;
  }
  if (shape.type === "freehand") {
    return shape.points.length >= 4;
  }
  return true;
}
