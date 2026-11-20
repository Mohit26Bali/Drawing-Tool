import Konva from "konva";
import type { CanvasShape } from "@/types/canvas";

export function createShapeNode(shape: CanvasShape): Konva.Shape {
  const node = buildNode(shape);
  node.id(shape.id);
  applyShapeAttrs(node, shape);
  return node;
}

function buildNode(shape: CanvasShape): Konva.Shape {
  switch (shape.type) {
    case "rectangle":
      return new Konva.Rect({ cornerRadius: 4 });
    case "ellipse":
      return new Konva.Ellipse({ radiusX: 0, radiusY: 0 });
    case "arrow":
      return new Konva.Arrow({ points: [], pointerLength: 10, pointerWidth: 10, hitStrokeWidth: 20 });
    case "freehand":
      return new Konva.Line({ tension: 0.4, lineCap: "round", lineJoin: "round", hitStrokeWidth: 20 });
    case "text":
      return new Konva.Text({});
  }
}

export function applyShapeAttrs(node: Konva.Shape, shape: CanvasShape) {
  const fill = shape.fill === "transparent" ? undefined : shape.fill;
  node.rotation(shape.rotation);

  switch (shape.type) {
    case "rectangle":
      node.setAttrs({
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        stroke: shape.stroke,
        fill,
        strokeWidth: shape.strokeWidth,
      });
      break;
    case "ellipse":
      node.setAttrs({
        x: shape.x + shape.width / 2,
        y: shape.y + shape.height / 2,
        radiusX: Math.abs(shape.width) / 2,
        radiusY: Math.abs(shape.height) / 2,
        stroke: shape.stroke,
        fill,
        strokeWidth: shape.strokeWidth,
      });
      break;
    case "arrow":
      node.setAttrs({
        x: shape.x,
        y: shape.y,
        points: shape.points,
        stroke: shape.stroke,
        fill: shape.stroke,
        strokeWidth: shape.strokeWidth,
      });
      break;
    case "freehand":
      node.setAttrs({
        x: shape.x,
        y: shape.y,
        points: shape.points,
        stroke: shape.stroke,
        strokeWidth: shape.strokeWidth,
      });
      break;
    case "text":
      node.setAttrs({
        x: shape.x,
        y: shape.y,
        text: shape.text || "Double-click to edit",
        fontSize: shape.fontSize,
        width: shape.width,
        fill: shape.stroke,
        opacity: shape.text ? 1 : 0.5,
      });
      break;
  }
}
