import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/http";
import { canEdit, getBoardAccess } from "../lib/access";
import { LIMITS, shapeSchema } from "../lib/schemas";
import { emitToBoard } from "../socket";
import { toClientShape, toShapeCreateInput, type ShapePayload } from "../socket/shape-mapper";

const versionSelect = {
  id: true,
  label: true,
  createdAt: true,
  user: { select: { id: true, name: true } },
} as const;

async function snapshotCurrentShapes(boardId: string): Promise<ShapePayload[]> {
  const rows = await prisma.shape.findMany({ where: { boardId } });
  return rows.map(toClientShape).filter((s): s is ShapePayload => s !== null);
}

/** Keeps only the newest versions so a board's history cannot grow forever. */
async function pruneOldVersions(boardId: string) {
  const old = await prisma.boardVersion.findMany({
    where: { boardId },
    orderBy: { createdAt: "desc" },
    skip: LIMITS.versionsPerBoard,
    select: { id: true },
  });
  if (old.length > 0) {
    await prisma.boardVersion.deleteMany({ where: { id: { in: old.map((v) => v.id) } } });
  }
}

export async function listVersions(req: Request, res: Response) {
  const { boardId } = req.params;
  const access = await getBoardAccess(boardId, req.user!.id);
  if (!access) throw new HttpError(404, "Board not found");

  const versions = await prisma.boardVersion.findMany({
    where: { boardId },
    select: versionSelect,
    orderBy: { createdAt: "desc" },
  });

  res.json({ versions });
}

export async function createVersion(req: Request, res: Response) {
  const userId = req.user!.id;
  const { boardId } = req.params;
  const { label } = req.body as { label?: string };

  const access = await getBoardAccess(boardId, userId);
  if (!access) throw new HttpError(404, "Board not found");
  if (!canEdit(access.role)) throw new HttpError(403, "You have view-only access to this board");

  const data = await snapshotCurrentShapes(boardId);

  const version = await prisma.boardVersion.create({
    data: { boardId, createdBy: userId, label: label || null, data: data as unknown as Prisma.InputJsonValue },
    select: versionSelect,
  });
  await pruneOldVersions(boardId);

  res.status(201).json({ version });
}

export async function restoreVersion(req: Request, res: Response) {
  const userId = req.user!.id;
  const { boardId, versionId } = req.params;

  const access = await getBoardAccess(boardId, userId);
  if (!access) throw new HttpError(404, "Board not found");
  if (!canEdit(access.role)) throw new HttpError(403, "You have view-only access to this board");

  const version = await prisma.boardVersion.findFirst({ where: { id: versionId, boardId } });
  if (!version) throw new HttpError(404, "Version not found");

  // Stored snapshots are checked again, so a damaged row can never put bad data on the board.
  const stored = Array.isArray(version.data) ? version.data : [];
  const restoredShapes: ShapePayload[] = [];
  for (const item of stored.slice(0, LIMITS.shapesPerBoard)) {
    const parsed = shapeSchema.safeParse(item);
    if (parsed.success) restoredShapes.push(parsed.data);
  }
  const currentSnapshot = await snapshotCurrentShapes(boardId);

  await prisma.$transaction([
    prisma.boardVersion.create({
      data: {
        boardId,
        createdBy: userId,
        label: "Before restore",
        data: currentSnapshot as unknown as Prisma.InputJsonValue,
      },
    }),
    prisma.shape.deleteMany({ where: { boardId } }),
    prisma.shape.createMany({
      data: restoredShapes.map((s) => toShapeCreateInput(s, boardId)),
      skipDuplicates: true,
    }),
  ]);
  await pruneOldVersions(boardId);

  emitToBoard(boardId, "board:restored", restoredShapes);
  res.json({ shapes: restoredShapes });
}
