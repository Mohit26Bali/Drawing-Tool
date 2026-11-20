export type ShapeType = "rectangle" | "ellipse" | "arrow" | "text" | "freehand";

export type ToolType = "select" | "hand" | ShapeType;

interface BaseCanvasShape {
  id: string;
  x: number;
  y: number;
  rotation: number;
  stroke: string;
  fill: string;
  strokeWidth: number;
}

export interface RectangleCanvasShape extends BaseCanvasShape {
  type: "rectangle";
  width: number;
  height: number;
}

export interface EllipseCanvasShape extends BaseCanvasShape {
  type: "ellipse";
  width: number;
  height: number;
}

export interface ArrowCanvasShape extends BaseCanvasShape {
  type: "arrow";
  points: number[];
}

export interface FreehandCanvasShape extends BaseCanvasShape {
  type: "freehand";
  points: number[];
}

export interface TextCanvasShape extends BaseCanvasShape {
  type: "text";
  text: string;
  width: number;
  fontSize: number;
}

export type CanvasShape =
  | RectangleCanvasShape
  | EllipseCanvasShape
  | ArrowCanvasShape
  | FreehandCanvasShape
  | TextCanvasShape;
