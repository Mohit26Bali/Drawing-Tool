export interface User {
  id: string;
  email: string;
  name: string;
}

/** What the signed-in person may do on a board. */
export type BoardRole = "OWNER" | "EDITOR" | "VIEWER";

export interface Board {
  id: string;
  title: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  /** Present on the boards list and the single-board response. */
  role?: BoardRole;
  owner?: { id: string; name: string } | null;
  memberCount?: number;
}

export interface Shape {
  id: string;
  boardId: string;
  type: string;
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  rotation: number;
  fill: string | null;
  stroke: string | null;
  text: string | null;
  points: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface BoardWithShapes extends Board {
  shapes: Shape[];
}

export interface BoardMember {
  userId: string;
  role: "EDITOR" | "VIEWER";
  user: { id: string; name: string; email: string };
}

export interface BoardMembers {
  role: BoardRole;
  owner: { id: string; name: string; email: string } | null;
  members: BoardMember[];
}
