import type { Board } from "@prisma/client";
import { prisma } from "./prisma";

export type BoardRole = "OWNER" | "EDITOR" | "VIEWER";

export interface BoardAccess {
  board: Board;
  role: BoardRole;
}

/** The user's role on a board, or null when the board does not exist or they have no access. */
export async function getBoardAccess(boardId: string, userId: string): Promise<BoardAccess | null> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: { members: { where: { userId }, select: { role: true } } },
  });
  if (!board) return null;

  const { members, ...plain } = board;
  if (plain.ownerId === userId) return { board: plain, role: "OWNER" };

  const membership = members[0];
  if (!membership) return null;
  return { board: plain, role: membership.role === "VIEWER" ? "VIEWER" : "EDITOR" };
}

/** Owners and editors can change the board. Viewers can only look. */
export function canEdit(role: BoardRole): boolean {
  return role === "OWNER" || role === "EDITOR";
}
