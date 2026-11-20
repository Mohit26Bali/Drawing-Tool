import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/http";
import { canEdit, getBoardAccess } from "../lib/access";
import { emitToBoard } from "../socket";

export async function listBoardComments(req: Request, res: Response) {
  const { boardId } = req.params;

  const access = await getBoardAccess(boardId, req.user!.id);
  if (!access) throw new HttpError(404, "Board not found");

  const comments = await prisma.comment.findMany({
    where: { shape: { boardId } },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  res.json({ comments });
}

export async function createComment(req: Request, res: Response) {
  const userId = req.user!.id;
  const { boardId } = req.params;
  const { shapeId, text } = req.body as { shapeId: string; text: string };

  const access = await getBoardAccess(boardId, userId);
  if (!access) throw new HttpError(404, "Board not found");
  if (!canEdit(access.role)) throw new HttpError(403, "You have view-only access to this board");

  const shape = await prisma.shape.findFirst({ where: { id: shapeId, boardId } });
  if (!shape) throw new HttpError(404, "Shape not found");

  const comment = await prisma.comment.create({
    data: { shapeId, userId, text },
    include: { user: { select: { id: true, name: true } } },
  });

  emitToBoard(boardId, "comment:create", comment);
  res.status(201).json({ comment });
}

export async function deleteComment(req: Request, res: Response) {
  const userId = req.user!.id;
  const { id } = req.params;

  const comment = await prisma.comment.findUnique({
    where: { id },
    include: { shape: { select: { boardId: true } } },
  });
  if (!comment) throw new HttpError(404, "Comment not found");

  const access = await getBoardAccess(comment.shape.boardId, userId);
  if (!access) throw new HttpError(404, "Comment not found");

  const isOwnComment = comment.userId === userId;
  if (!isOwnComment && access.role !== "OWNER") {
    throw new HttpError(403, "You can only delete your own comments");
  }

  await prisma.comment.delete({ where: { id } });

  emitToBoard(comment.shape.boardId, "comment:delete", { id, shapeId: comment.shapeId });
  res.status(204).send();
}
