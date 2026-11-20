import type { Server, Socket } from "socket.io";
import { Prisma } from "@prisma/client";
import { z, type ZodType } from "zod";
import { prisma } from "../lib/prisma";
import { canEdit, getBoardAccess } from "../lib/access";
import { LIMITS, cursorSchema, shapeIdsSchema, shapeSchema } from "../lib/schemas";
import { boardRoom } from "./index";
import { toClientShape, toShapeCreateInput, toShapeUpdateInput, type ShapePayload } from "./shape-mapper";

type JoinAck = (res: { shapes?: ShapePayload[]; role?: string; error?: string }) => void;

/** A simple allowance that refills over time, so one connection cannot flood the server. */
class Bucket {
  private tokens: number;
  private last = Date.now();
  constructor(
    private readonly capacity: number,
    private readonly perSecond: number,
  ) {
    this.tokens = capacity;
  }
  take(): boolean {
    const now = Date.now();
    this.tokens = Math.min(this.capacity, this.tokens + ((now - this.last) / 1000) * this.perSecond);
    this.last = now;
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}

const joinSchema = z.uuid();

export function registerBoardHandlers(_io: Server, socket: Socket) {
  const user = socket.data.user;
  const shapeBucket = new Bucket(200, 100);
  const cursorBucket = new Bucket(120, 60);
  const joinBucket = new Bucket(10, 2);
  let lastReport = 0;

  /** Tells the sender something went wrong (at most every few seconds, so it cannot be used to spam). */
  function report(event: string, message: string) {
    const now = Date.now();
    if (now - lastReport < 3000) return;
    lastReport = now;
    socket.emit("error:event", { event, message });
  }

  /**
   * Every event goes through here: the payload is validated, the allowance is checked and any error is caught.
   * A malformed message from one client can never throw out of a handler and take the server down.
   */
  function handle<T>(event: string, schema: ZodType<T>, bucket: Bucket, run: (data: T) => Promise<void> | void) {
    socket.on(event, async (raw: unknown) => {
      try {
        if (!bucket.take()) return;
        const parsed = schema.safeParse(raw);
        if (!parsed.success) {
          report(event, "Invalid data");
          return;
        }
        await run(parsed.data);
      } catch (err) {
        console.error(`Socket event "${event}" failed:`, err);
        report(event, "Something went wrong");
      }
    });
  }

  function leaveCurrent() {
    const boardId = socket.data.boardId;
    if (!boardId) return;
    socket.leave(boardRoom(boardId));
    socket.to(boardRoom(boardId)).emit("presence:leave", { userId: user.id });
    socket.data.boardId = undefined;
    socket.data.role = undefined;
  }

  socket.on("board:join", async (rawBoardId: unknown, rawAck: unknown) => {
    const ack: JoinAck = typeof rawAck === "function" ? (rawAck as JoinAck) : () => {};
    try {
      if (!joinBucket.take()) {
        ack({ error: "Too many requests" });
        return;
      }
      const parsed = joinSchema.safeParse(rawBoardId);
      if (!parsed.success) {
        ack({ error: "Board not found" });
        return;
      }

      const access = await getBoardAccess(parsed.data, user.id);
      if (!access) {
        ack({ error: "Board not found" });
        return;
      }

      if (socket.data.boardId && socket.data.boardId !== access.board.id) leaveCurrent();
      socket.data.boardId = access.board.id;
      socket.data.role = access.role;
      socket.join(boardRoom(access.board.id));

      const rows = await prisma.shape.findMany({ where: { boardId: access.board.id } });
      const shapes = rows.map(toClientShape).filter((s): s is ShapePayload => s !== null);
      ack({ shapes, role: access.role });
    } catch (err) {
      console.error('Socket event "board:join" failed:', err);
      ack({ error: "Could not open this board" });
    }
  });

  socket.on("board:leave", (rawBoardId: unknown) => {
    try {
      if (rawBoardId === socket.data.boardId) leaveCurrent();
    } catch (err) {
      console.error('Socket event "board:leave" failed:', err);
    }
  });

  /** The board and role this connection is currently allowed to edit, or null (with a message to the sender). */
  function editableBoard(event: string): string | null {
    const boardId = socket.data.boardId;
    const role = socket.data.role;
    if (!boardId || !role) return null;
    if (!canEdit(role)) {
      report(event, "You have view-only access to this board");
      return null;
    }
    return boardId;
  }

  handle("shape:create", shapeSchema, shapeBucket, async (payload) => {
    const boardId = editableBoard("shape:create");
    if (!boardId) return;

    const count = await prisma.shape.count({ where: { boardId } });
    if (count >= LIMITS.shapesPerBoard) {
      report("shape:create", `A board can hold at most ${LIMITS.shapesPerBoard} shapes`);
      return;
    }

    try {
      await prisma.shape.create({ data: toShapeCreateInput(payload, boardId) });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        report("shape:create", "That shape already exists");
        return;
      }
      throw err;
    }
    socket.to(boardRoom(boardId)).emit("shape:create", payload);
  });

  handle("shape:update", shapeSchema, shapeBucket, async (payload) => {
    const boardId = editableBoard("shape:update");
    if (!boardId) return;

    // Scoped to this board: a shape belonging to any other board is never touched.
    const result = await prisma.shape.updateMany({
      where: { id: payload.id, boardId },
      data: toShapeUpdateInput(payload) as Prisma.ShapeUncheckedUpdateManyInput,
    });
    if (result.count === 0) return;
    socket.to(boardRoom(boardId)).emit("shape:update", payload);
  });

  handle("shape:delete", shapeIdsSchema, shapeBucket, async (ids) => {
    const boardId = editableBoard("shape:delete");
    if (!boardId) return;

    const owned = await prisma.shape.findMany({ where: { id: { in: ids }, boardId }, select: { id: true } });
    if (owned.length === 0) return;
    const ownedIds = owned.map((s) => s.id);
    await prisma.shape.deleteMany({ where: { id: { in: ownedIds }, boardId } });
    socket.to(boardRoom(boardId)).emit("shape:delete", ownedIds);
  });

  handle("cursor:move", cursorSchema, cursorBucket, (point) => {
    const boardId = socket.data.boardId;
    if (!boardId) return;
    socket.to(boardRoom(boardId)).emit("cursor:move", {
      userId: user.id,
      name: user.name,
      x: point.x,
      y: point.y,
    });
  });

  socket.on("disconnect", () => {
    try {
      leaveCurrent();
    } catch (err) {
      console.error("Socket disconnect cleanup failed:", err);
    }
  });
}
