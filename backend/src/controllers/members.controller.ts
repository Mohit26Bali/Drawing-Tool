import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/http";
import { getBoardAccess } from "../lib/access";
import { LIMITS } from "../lib/schemas";
import { applyMembershipChange } from "../socket";

const userSelect = { id: true, name: true, email: true } as const;

async function requireOwner(req: Request) {
  const access = await getBoardAccess(req.params.id, req.user!.id);
  if (!access) throw new HttpError(404, "Board not found");
  if (access.role !== "OWNER") throw new HttpError(403, "Only the owner can manage who has access");
  return access;
}

/** Everyone with access, owner first. Any member can see the list. */
export async function listMembers(req: Request, res: Response) {
  const access = await getBoardAccess(req.params.id, req.user!.id);
  if (!access) throw new HttpError(404, "Board not found");

  const [owner, members] = await Promise.all([
    prisma.user.findUnique({ where: { id: access.board.ownerId }, select: userSelect }),
    prisma.boardMember.findMany({
      where: { boardId: access.board.id },
      include: { user: { select: userSelect } },
      orderBy: { id: "asc" },
    }),
  ]);

  res.json({
    role: access.role,
    owner,
    members: members.map((m) => ({ userId: m.userId, role: m.role, user: m.user })),
  });
}

export async function addMember(req: Request, res: Response) {
  const access = await requireOwner(req);
  const { email, role } = req.body as { email: string; role: "EDITOR" | "VIEWER" };

  const invitee = await prisma.user.findUnique({ where: { email }, select: userSelect });
  if (!invitee) {
    throw new HttpError(404, "No account with that email yet. Ask them to sign up first, then invite them.");
  }
  if (invitee.id === access.board.ownerId) {
    throw new HttpError(409, "That is the owner of this board");
  }

  const count = await prisma.boardMember.count({ where: { boardId: access.board.id } });
  if (count >= LIMITS.membersPerBoard) {
    throw new HttpError(409, `A board can have at most ${LIMITS.membersPerBoard} members`);
  }

  // Inviting someone who is already a member just changes their role.
  const member = await prisma.boardMember.upsert({
    where: { boardId_userId: { boardId: access.board.id, userId: invitee.id } },
    update: { role },
    create: { boardId: access.board.id, userId: invitee.id, role },
  });
  applyMembershipChange(access.board.id, invitee.id, role);

  res.status(201).json({ member: { userId: member.userId, role: member.role, user: invitee } });
}

export async function updateMember(req: Request, res: Response) {
  const access = await requireOwner(req);
  const { role } = req.body as { role: "EDITOR" | "VIEWER" };
  const { userId } = req.params;

  const existing = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId: access.board.id, userId } },
  });
  if (!existing) throw new HttpError(404, "That person is not a member of this board");

  const member = await prisma.boardMember.update({
    where: { boardId_userId: { boardId: access.board.id, userId } },
    data: { role },
    include: { user: { select: userSelect } },
  });
  applyMembershipChange(access.board.id, userId, role);

  res.json({ member: { userId: member.userId, role: member.role, user: member.user } });
}

/** The owner can remove anyone. A member can remove themselves (leave the board). */
export async function removeMember(req: Request, res: Response) {
  const access = await getBoardAccess(req.params.id, req.user!.id);
  if (!access) throw new HttpError(404, "Board not found");

  const { userId } = req.params;
  const isSelf = userId === req.user!.id;
  if (access.role !== "OWNER" && !isSelf) {
    throw new HttpError(403, "Only the owner can remove other people");
  }
  if (userId === access.board.ownerId) {
    throw new HttpError(409, "The owner cannot be removed. Delete the board instead.");
  }

  const result = await prisma.boardMember.deleteMany({ where: { boardId: access.board.id, userId } });
  if (result.count === 0) throw new HttpError(404, "That person is not a member of this board");

  applyMembershipChange(access.board.id, userId, null);
  res.status(204).send();
}
