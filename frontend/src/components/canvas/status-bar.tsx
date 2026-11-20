"use client";

import { motion } from "framer-motion";
import { useCanvasStore } from "@/store/canvas-store";
import { useToolStore } from "@/store/tool-store";

const TOOL_LABELS: Record<string, string> = {
  select: "Select",
  hand: "Pan",
  rectangle: "Rectangle",
  ellipse: "Ellipse",
  arrow: "Arrow",
  freehand: "Freehand",
  text: "Text",
};

export function StatusBar() {
  const tool = useToolStore((s) => s.tool);
  const shapeCount = useCanvasStore((s) => s.shapes.length);
  const selectedCount = useCanvasStore((s) => s.selectedIds.length);
  const viewOnly = useCanvasStore((s) => s.role === "VIEWER");
  const offline = useCanvasStore((s) => s.offline);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="absolute bottom-4 left-4 z-10 flex items-center gap-3 rounded-lg border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-lg"
    >
      <span className="font-medium text-foreground">{TOOL_LABELS[tool]}</span>
      <span>{shapeCount} shape{shapeCount === 1 ? "" : "s"}</span>
      {selectedCount > 0 && <span>{selectedCount} selected</span>}
      {viewOnly && <span className="font-medium text-foreground">View only</span>}
      {offline && (
        <span role="status" className="font-medium text-destructive">
          Offline, reconnecting. Editing is paused.
        </span>
      )}
      <span className="hidden sm:inline">Del to delete · Ctrl+Z undo · Space to pan</span>
    </motion.div>
  );
}
