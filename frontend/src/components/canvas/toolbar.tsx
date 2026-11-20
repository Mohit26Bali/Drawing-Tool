"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Circle,
  Hand,
  MousePointer2,
  Pencil,
  Redo2,
  Square,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToolStore } from "@/store/tool-store";
import { useCanvasStore } from "@/store/canvas-store";
import type { ToolType } from "@/types/canvas";

const TOOLS: { tool: ToolType; icon: React.ComponentType<{ className?: string }>; label: string; shortcut: string }[] = [
  { tool: "select", icon: MousePointer2, label: "Select", shortcut: "V" },
  { tool: "hand", icon: Hand, label: "Pan", shortcut: "H" },
  { tool: "rectangle", icon: Square, label: "Rectangle", shortcut: "R" },
  { tool: "ellipse", icon: Circle, label: "Ellipse", shortcut: "O" },
  { tool: "arrow", icon: ArrowUpRight, label: "Arrow", shortcut: "A" },
  { tool: "freehand", icon: Pencil, label: "Freehand", shortcut: "F" },
  { tool: "text", icon: Type, label: "Text", shortcut: "T" },
];

export function Toolbar() {
  const tool = useToolStore((s) => s.tool);
  const setTool = useToolStore((s) => s.setTool);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const deleteShapes = useCanvasStore((s) => s.deleteShapes);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const canUndo = useCanvasStore((s) => s.past.length > 0);
  const canRedo = useCanvasStore((s) => s.future.length > 0);
  const viewOnly = useCanvasStore((s) => s.role === "VIEWER");

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-1 rounded-xl border bg-card p-1.5 shadow-lg"
    >
      {TOOLS.map(({ tool: t, icon: Icon, label, shortcut }) => (
        <Button
          key={t}
          variant={tool === t ? "secondary" : "ghost"}
          size="icon"
          title={viewOnly && t !== "select" && t !== "hand" ? `${label} (view-only)` : `${label} (${shortcut})`}
          aria-label={label}
          aria-pressed={tool === t}
          disabled={viewOnly && t !== "select" && t !== "hand"}
          onClick={() => setTool(t)}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}

      <div className="mx-1 h-6 w-px bg-border" />

      <Button variant="ghost" size="icon" title="Undo (Ctrl+Z)" aria-label="Undo" disabled={viewOnly || !canUndo} onClick={undo}>
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" title="Redo (Ctrl+Shift+Z)" aria-label="Redo" disabled={viewOnly || !canRedo} onClick={redo}>
        <Redo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title="Delete (Del)"
        aria-label="Delete selected"
        disabled={viewOnly || selectedIds.length === 0}
        onClick={() => deleteShapes(selectedIds)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}
