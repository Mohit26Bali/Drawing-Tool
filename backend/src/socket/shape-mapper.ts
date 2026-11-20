import { Prisma, type Shape as PrismaShape } from "@prisma/client";

export interface ShapePayload {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation: number;
  stroke: string;
  fill: string;
  strokeWidth: number;
  width?: number;
  height?: number;
  points?: number[];
  text?: string;
  fontSize?: number;
}

export function toShapeCreateInput(payload: ShapePayload, boardId: string): Prisma.ShapeUncheckedCreateInput {
  return {
    id: payload.id,
    boardId,
    type: payload.type,
    x: payload.x,
    y: payload.y,
    width: payload.width ?? null,
    height: payload.height ?? null,
    rotation: payload.rotation,
    fill: payload.fill,
    stroke: payload.stroke,
    strokeWidth: payload.strokeWidth,
    text: payload.text ?? null,
    fontSize: payload.fontSize ?? null,
    points: payload.points ?? undefined,
  };
}

export function toShapeUpdateInput(payload: ShapePayload): Prisma.ShapeUncheckedUpdateInput {
  return {
    type: payload.type,
    x: payload.x,
    y: payload.y,
    width: payload.width ?? null,
    height: payload.height ?? null,
    rotation: payload.rotation,
    fill: payload.fill,
    stroke: payload.stroke,
    strokeWidth: payload.strokeWidth,
    text: payload.text ?? null,
    fontSize: payload.fontSize ?? null,
    points: payload.points ?? Prisma.JsonNull,
  };
}

export function toClientShape(row: PrismaShape): ShapePayload | null {
  const base = {
    id: row.id,
    x: row.x,
    y: row.y,
    rotation: row.rotation,
    stroke: row.stroke ?? "#e5e5e5",
    fill: row.fill ?? "transparent",
    strokeWidth: row.strokeWidth,
  };

  switch (row.type) {
    case "rectangle":
    case "ellipse":
      return { ...base, type: row.type, width: row.width ?? 0, height: row.height ?? 0 };
    case "arrow":
    case "freehand":
      return { ...base, type: row.type, points: (row.points as number[] | null) ?? [] };
    case "text":
      return {
        ...base,
        type: "text",
        text: row.text ?? "",
        width: row.width ?? 200,
        fontSize: row.fontSize ?? 20,
      };
    default:
      return null;
  }
}
