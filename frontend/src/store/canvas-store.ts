import { create } from "zustand";
import type { CanvasShape } from "@/types/canvas";
import type { BoardRole } from "@/types";

const MAX_HISTORY = 50;

interface CanvasState {
  shapes: CanvasShape[];
  selectedIds: string[];
  past: CanvasShape[][];
  future: CanvasShape[][];
  /** Bumped only by applyRemote* actions, so subscribers can distinguish local vs remote changes. */
  remoteVersion: number;
  /** The signed-in person's role on the open board (null until the server confirms it). */
  role: BoardRole | null;
  /** True while the connection to the server is down. Editing pauses so nothing can drift out of sync. */
  offline: boolean;
  addShape: (shape: CanvasShape) => void;
  updateShape: (id: string, patch: Partial<CanvasShape>) => void;
  updateShapes: (updates: { id: string; patch: Partial<CanvasShape> }[]) => void;
  deleteShapes: (ids: string[]) => void;
  setSelectedIds: (ids: string[]) => void;
  undo: () => void;
  redo: () => void;
  applyRemoteUpsert: (shape: CanvasShape) => void;
  applyRemoteDelete: (ids: string[]) => void;
  applyRemoteSet: (shapes: CanvasShape[]) => void;
  setRole: (role: BoardRole | null) => void;
  setOffline: (offline: boolean) => void;
  resetCanvas: () => void;
}

/** Viewers cannot change the board, and nobody can while the connection is down. */
function locked(state: Pick<CanvasState, "role" | "offline">) {
  return state.role === "VIEWER" || state.offline;
}

function snapshot(state: CanvasState) {
  const past = [...state.past, state.shapes].slice(-MAX_HISTORY);
  return { past, future: [] as CanvasShape[][] };
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  shapes: [],
  selectedIds: [],
  past: [],
  future: [],
  remoteVersion: 0,
  role: null,
  offline: false,

  addShape: (shape) =>
    set((state) =>
      locked(state)
        ? state
        : {
            ...snapshot(state),
            shapes: [...state.shapes, shape],
            selectedIds: [shape.id],
          }
    ),

  updateShape: (id, patch) =>
    set((state) =>
      locked(state)
        ? state
        : {
            ...snapshot(state),
            shapes: state.shapes.map((s) => (s.id === id ? ({ ...s, ...patch } as CanvasShape) : s)),
          }
    ),

  updateShapes: (updates) =>
    set((state) => {
      if (locked(state)) return state;
      const patchMap = new Map(updates.map((u) => [u.id, u.patch]));
      return {
        ...snapshot(state),
        shapes: state.shapes.map((s) =>
          patchMap.has(s.id) ? ({ ...s, ...patchMap.get(s.id) } as CanvasShape) : s
        ),
      };
    }),

  deleteShapes: (ids) =>
    set((state) => {
      if (locked(state)) return state;
      const idSet = new Set(ids);
      return {
        ...snapshot(state),
        shapes: state.shapes.filter((s) => !idSet.has(s.id)),
        selectedIds: state.selectedIds.filter((id) => !idSet.has(id)),
      };
    }),

  setSelectedIds: (selectedIds) => set({ selectedIds }),

  undo: () => {
    if (locked(get())) return;
    const { past, shapes, future } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    set({
      shapes: previous,
      past: past.slice(0, -1),
      future: [shapes, ...future].slice(0, MAX_HISTORY),
      selectedIds: [],
    });
  },

  redo: () => {
    if (locked(get())) return;
    const { future, shapes, past } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      shapes: next,
      future: future.slice(1),
      past: [...past, shapes].slice(-MAX_HISTORY),
      selectedIds: [],
    });
  },

  applyRemoteUpsert: (shape) =>
    set((state) => {
      const exists = state.shapes.some((s) => s.id === shape.id);
      return {
        shapes: exists ? state.shapes.map((s) => (s.id === shape.id ? shape : s)) : [...state.shapes, shape],
        remoteVersion: state.remoteVersion + 1,
      };
    }),

  applyRemoteDelete: (ids) =>
    set((state) => {
      const idSet = new Set(ids);
      return {
        shapes: state.shapes.filter((s) => !idSet.has(s.id)),
        selectedIds: state.selectedIds.filter((id) => !idSet.has(id)),
        remoteVersion: state.remoteVersion + 1,
      };
    }),

  applyRemoteSet: (shapes) =>
    set((state) => ({ shapes, remoteVersion: state.remoteVersion + 1 })),

  setRole: (role) => set({ role }),

  setOffline: (offline) => set({ offline }),

  resetCanvas: () =>
    set((state) => ({
      shapes: [],
      selectedIds: [],
      past: [],
      future: [],
      role: null,
      offline: false,
      remoteVersion: state.remoteVersion + 1,
    })),
}));
