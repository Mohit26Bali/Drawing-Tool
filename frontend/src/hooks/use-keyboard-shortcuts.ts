import { useEffect } from "react";
import { useCanvasStore } from "@/store/canvas-store";
import { useToolStore } from "@/store/tool-store";
import type { ToolType } from "@/types/canvas";

const TOOL_SHORTCUTS: Record<string, ToolType> = {
  v: "select",
  h: "hand",
  r: "rectangle",
  o: "ellipse",
  a: "arrow",
  f: "freehand",
  t: "text",
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

export function useKeyboardShortcuts() {
  const deleteShapes = useCanvasStore((s) => s.deleteShapes);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const setSelectedIds = useCanvasStore((s) => s.setSelectedIds);
  const setTool = useToolStore((s) => s.setTool);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;

      const isMeta = e.ctrlKey || e.metaKey;

      if (isMeta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (isMeta && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        const selectedIds = useCanvasStore.getState().selectedIds;
        if (selectedIds.length > 0) {
          e.preventDefault();
          deleteShapes(selectedIds);
        }
        return;
      }

      if (e.key === "Escape") {
        setSelectedIds([]);
        setTool("select");
        return;
      }

      const tool = TOOL_SHORTCUTS[e.key.toLowerCase()];
      if (tool && !isMeta) {
        const viewOnly = useCanvasStore.getState().role === "VIEWER";
        if (viewOnly && tool !== "select" && tool !== "hand") return;
        setTool(tool);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteShapes, undo, redo, setSelectedIds, setTool]);
}
