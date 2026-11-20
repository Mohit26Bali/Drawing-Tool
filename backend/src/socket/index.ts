import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { verifyToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";
import type { BoardRole } from "../lib/access";
import { registerBoardHandlers } from "./board.handlers";

export interface SocketUser {
  id: string;
  email: string;
  name: string;
}

declare module "socket.io" {
  interface SocketData {
    user: SocketUser;
    boardId?: string;
    role?: BoardRole;
  }
}

let ioInstance: Server | null = null;

export function getIO(): Server {
  if (!ioInstance) {
    throw new Error("Socket.IO server has not been initialized yet");
  }
  return ioInstance;
}

export function boardRoom(boardId: string) {
  return `board:${boardId}`;
}

/** Sends an event to everyone viewing a board. Does nothing when no socket server is running (for example in API-only tests). */
export function emitToBoard(boardId: string, event: string, payload: unknown) {
  ioInstance?.to(boardRoom(boardId)).emit(event, payload);
}

export function createSocketServer(httpServer: HttpServer, allowedOrigins: string[]) {
  const io = new Server(httpServer, {
    cors: { origin: allowedOrigins },
    // Drawing events are small. A single huge message is never legitimate, so it is refused at the transport.
    maxHttpBufferSize: 1_000_000,
    pingInterval: 25_000,
    pingTimeout: 20_000,
  });
  ioInstance = io;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== "string" || !token) {
        next(new Error("Not authenticated"));
        return;
      }

      const payload = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, email: true, name: true },
      });
      if (!user) {
        next(new Error("User not found"));
        return;
      }
      socket.data.user = user;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    registerBoardHandlers(io, socket);
  });

  return io;
}

/**
 * Called after the owner changes someone's role or removes them. Live connections are updated at once,
 * so a removed person stops receiving the board and a viewer can no longer draw, without reconnecting.
 */
export function applyMembershipChange(boardId: string, userId: string, role: "EDITOR" | "VIEWER" | null) {
  if (!ioInstance) return;
  const room = boardRoom(boardId);

  for (const socket of ioInstance.sockets.sockets.values()) {
    if (socket.data.user?.id !== userId || socket.data.boardId !== boardId) continue;

    if (role === null) {
      socket.leave(room);
      socket.data.boardId = undefined;
      socket.data.role = undefined;
      socket.to(room).emit("presence:leave", { userId });
      socket.emit("board:removed", { boardId, reason: "access-removed" });
    } else {
      socket.data.role = role;
      socket.emit("board:role", { boardId, role });
    }
  }
}

/** Called after a board is deleted, so everyone still looking at it is told. */
export function closeBoardRoom(boardId: string) {
  if (!ioInstance) return;
  const room = boardRoom(boardId);
  ioInstance.to(room).emit("board:removed", { boardId, reason: "board-deleted" });
  for (const socket of ioInstance.sockets.sockets.values()) {
    if (socket.data.boardId === boardId) {
      socket.leave(room);
      socket.data.boardId = undefined;
      socket.data.role = undefined;
    }
  }
}
