import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/http";
import { getBoardAccess } from "../lib/access";
import { LIMITS, type ShapeInput } from "../lib/schemas";
import { toShapeCreateInput } from "../socket/shape-mapper";
import { closeBoardRoom } from "../socket";

export async function listBoards(req: Request, res: Response) {
  const userId = req.user!.id;

  const rows = await prisma.board.findMany({
    where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
    orderBy: { updatedAt: "desc" },
    include: {
      owner: { select: { id: true, name: true } },
      members: { where: { userId }, select: { role: true } },
      _count: { select: { members: true } },
    },
  });

  const boards = rows.map(({ members, _count, ...board }) => ({
    ...board,
    role: board.ownerId === userId ? "OWNER" : members[0]?.role === "VIEWER" ? "VIEWER" : "EDITOR",
    memberCount: _count.members,
  }));

  res.json({ boards });
}

export async function createBoard(req: Request, res: Response) {
  const userId = req.user!.id;
  const { title } = req.body as { title: string };

  const owned = await prisma.board.count({ where: { ownerId: userId } });
  if (owned >= LIMITS.boardsPerUser) {
    throw new HttpError(409, `You can own at most ${LIMITS.boardsPerUser} boards`);
  }

  const board = await prisma.board.create({ data: { title, ownerId: userId } });
  res.status(201).json({ board });
}

export async function importBoard(req: Request, res: Response) {
  const userId = req.user!.id;
  const { title, shapes } = req.body as { title: string; shapes: ShapeInput[] };

  const owned = await prisma.board.count({ where: { ownerId: userId } });
  if (owned >= LIMITS.boardsPerUser) {
    throw new HttpError(409, `You can own at most ${LIMITS.boardsPerUser} boards`);
  }

  const board = await prisma.$transaction(async (tx) => {
    const created = await tx.board.create({ data: { title, ownerId: userId } });
    if (shapes.length > 0) {
      await tx.shape.createMany({
        data: shapes.map((shape) => {
          // Fresh ids on import, so importing the same export twice never collides with existing rows.
          const { id: _id, ...rest } = toShapeCreateInput(shape, created.id);
          return rest;
        }),
      });
    }
    return created;
  });

  res.status(201).json({ board });
}

export async function getBoard(req: Request, res: Response) {
  const access = await getBoardAccess(req.params.id, req.user!.id);
  if (!access) {
    throw new HttpError(404, "Board not found");
  }

  const [shapes, owner] = await Promise.all([
    prisma.shape.findMany({ where: { boardId: access.board.id }, orderBy: { createdAt: "asc" } }),
    prisma.user.findUnique({ where: { id: access.board.ownerId }, select: { id: true, name: true } }),
  ]);

  res.json({ board: { ...access.board, role: access.role, owner, shapes } });
}

export async function updateBoard(req: Request, res: Response) {
  const access = await getBoardAccess(req.params.id, req.user!.id);
  if (!access) throw new HttpError(404, "Board not found");
  if (access.role !== "OWNER") throw new HttpError(403, "Only the owner can rename this board");

  const { title } = req.body as { title: string };
  const board = await prisma.board.update({ where: { id: access.board.id }, data: { title } });
  res.json({ board });
}

export async function deleteBoard(req: Request, res: Response) {
  const access = await getBoardAccess(req.params.id, req.user!.id);
  if (!access) throw new HttpError(404, "Board not found");
  if (access.role !== "OWNER") throw new HttpError(403, "Only the owner can delete this board");

  await prisma.board.delete({ where: { id: access.board.id } });
  closeBoardRoom(access.board.id);
  res.status(204).send();
}
