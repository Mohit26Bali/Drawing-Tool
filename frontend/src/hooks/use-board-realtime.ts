import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { useCanvasStore } from "@/store/canvas-store";
import { useToolStore } from "@/store/tool-store";
import { useViewportStore } from "@/store/viewport-store";
import type { BoardRole } from "@/types";
import type { CanvasShape } from "@/types/canvas";
import type { CursorPosition } from "@/types/presence";

interface JoinResponse {
  shapes?: CanvasShape[];
  role?: BoardRole;
  error?: string;
}

/** Viewers can look around but not draw, so they always start on the select tool. */
function applyRole(role: BoardRole) {
  const store = useCanvasStore.getState();
  store.setRole(role);
  if (role === "VIEWER") {
    useToolStore.getState().setTool("select");
  }
}

export function useBoardRealtime(boardId: string) {
  const [cursors, setCursors] = useState<Record<string, CursorPosition>>({});
  const router = useRouter();
  const queryClient = useQueryClient();

  // Join the board room, hydrate canvas from the server, and listen for remote events.
  useEffect(() => {
    const socket = getSocket();

    useCanvasStore.getState().resetCanvas();
    useViewportStore.getState().resetZoom();

    function handleShapeUpsert(shape: CanvasShape) {
      useCanvasStore.getState().applyRemoteUpsert(shape);
    }
    function handleShapeDelete(ids: string[]) {
      useCanvasStore.getState().applyRemoteDelete(ids);
    }
    function handleCursorMove(cursor: CursorPosition) {
      setCursors((prev) => ({ ...prev, [cursor.userId]: cursor }));
    }
    function handlePresenceLeave({ userId }: { userId: string }) {
      setCursors((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }
    function handleBoardRestored(shapes: CanvasShape[]) {
      useCanvasStore.getState().applyRemoteSet(shapes);
      useCanvasStore.getState().setSelectedIds([]);
    }
    function handleRole({ role }: { role: BoardRole }) {
      applyRole(role);
      toast.info(role === "VIEWER" ? "You now have view-only access to this board" : "You can now edit this board");
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    }
    function handleRemoved({ reason }: { reason: string }) {
      toast.error(reason === "board-deleted" ? "This board was deleted" : "You no longer have access to this board");
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      router.replace("/dashboard");
    }
    function handleServerError({ message }: { message: string }) {
      toast.error(message);
    }

    // Used for the first join and again after every reconnect, so a dropped connection recovers by itself.
    function join() {
      socket.emit("board:join", boardId, (res: JoinResponse) => {
        if (res.error || !res.shapes) {
          toast.error(res.error ?? "Could not open this board");
          router.replace("/dashboard");
          return;
        }
        if (res.role) applyRole(res.role);
        useCanvasStore.getState().applyRemoteSet(res.shapes);
        setCursors({});
        useCanvasStore.getState().setOffline(false);
      });
    }
    function handleConnect() {
      join();
    }
    function handleDisconnect() {
      useCanvasStore.getState().setOffline(true);
    }
    function handleConnectError() {
      useCanvasStore.getState().setOffline(true);
    }

    socket.on("shape:create", handleShapeUpsert);
    socket.on("shape:update", handleShapeUpsert);
    socket.on("shape:delete", handleShapeDelete);
    socket.on("cursor:move", handleCursorMove);
    socket.on("presence:leave", handlePresenceLeave);
    socket.on("board:restored", handleBoardRestored);
    socket.on("board:role", handleRole);
    socket.on("board:removed", handleRemoved);
    socket.on("error:event", handleServerError);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    if (socket.connected) {
      join();
    } else {
      socket.connect();
    }

    return () => {
      socket.emit("board:leave", boardId);
      socket.off("shape:create", handleShapeUpsert);
      socket.off("shape:update", handleShapeUpsert);
      socket.off("shape:delete", handleShapeDelete);
      socket.off("cursor:move", handleCursorMove);
      socket.off("presence:leave", handlePresenceLeave);
      socket.off("board:restored", handleBoardRestored);
      socket.off("board:role", handleRole);
      socket.off("board:removed", handleRemoved);
      socket.off("error:event", handleServerError);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, [boardId, router, queryClient]);

  // Broadcast local shape changes (skip changes that originated remotely).
  useEffect(() => {
    return useCanvasStore.subscribe((state, prevState) => {
      if (state.remoteVersion !== prevState.remoteVersion) return;
      if (state.shapes === prevState.shapes) return;
      if (state.role === "VIEWER" || state.offline) return;

      const socket = getSocket();
      const prevMap = new Map(prevState.shapes.map((s) => [s.id, s]));
      const nextIds = new Set(state.shapes.map((s) => s.id));

      state.shapes.forEach((shape) => {
        const old = prevMap.get(shape.id);
        if (!old) socket.emit("shape:create", shape);
        else if (old !== shape) socket.emit("shape:update", shape);
      });

      const deletedIds = prevState.shapes.filter((s) => !nextIds.has(s.id)).map((s) => s.id);
      if (deletedIds.length > 0) socket.emit("shape:delete", deletedIds);
    });
  }, []);

  return { cursors };
}
