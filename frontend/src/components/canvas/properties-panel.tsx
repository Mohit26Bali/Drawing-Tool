"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useToolStore } from "@/store/tool-store";
import { useCanvasStore } from "@/store/canvas-store";
import { cn } from "@/lib/utils";

const STROKE_COLORS = ["#f2efe6", "#f28fad", "#9bd7a0", "#8ecae6", "#f4d35e", "#f4a261"];
const FILL_COLORS = ["transparent", "#f28fad33", "#9bd7a033", "#8ecae633", "#f4d35e33", "#f4a26133"];
const STROKE_WIDTHS = [1, 2, 4];

export function PropertiesPanel() {
  const tool = useToolStore((s) => s.tool);
  const strokeColor = useToolStore((s) => s.strokeColor);
  const fillColor = useToolStore((s) => s.fillColor);
  const strokeWidth = useToolStore((s) => s.strokeWidth);
  const setStrokeColor = useToolStore((s) => s.setStrokeColor);
  const setFillColor = useToolStore((s) => s.setFillColor);
  const setStrokeWidth = useToolStore((s) => s.setStrokeWidth);

  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const shapes = useCanvasStore((s) => s.shapes);
  const updateShapes = useCanvasStore((s) => s.updateShapes);

  const viewOnly = useCanvasStore((s) => s.role === "VIEWER");
  const isDrawingTool = tool !== "select" && tool !== "hand";
  const hasSelection = selectedIds.length > 0;
  const visible = !viewOnly && (isDrawingTool || hasSelection);

  function applyStroke(color: string) {
    setStrokeColor(color);
    if (hasSelection) {
      updateShapes(selectedIds.map((id) => ({ id, patch: { stroke: color } })));
    }
  }

  function applyFill(color: string) {
    setFillColor(color);
    if (hasSelection) {
      updateShapes(selectedIds.map((id) => ({ id, patch: { fill: color } })));
    }
  }

  function applyStrokeWidth(width: number) {
    setStrokeWidth(width);
    if (hasSelection) {
      updateShapes(selectedIds.map((id) => ({ id, patch: { strokeWidth: width } })));
    }
  }

  const activeStroke = hasSelection
    ? (shapes.find((s) => s.id === selectedIds[0])?.stroke ?? strokeColor)
    : strokeColor;
  const activeFill = hasSelection
    ? (shapes.find((s) => s.id === selectedIds[0])?.fill ?? fillColor)
    : fillColor;
  const activeWidth = hasSelection
    ? (shapes.find((s) => s.id === selectedIds[0])?.strokeWidth ?? strokeWidth)
    : strokeWidth;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="properties-panel"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute left-4 top-1/2 z-10 flex w-44 -translate-y-1/2 flex-col gap-4 rounded-xl border bg-card p-3 shadow-lg"
        >
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Stroke</p>
            <div className="flex gap-1.5">
              {STROKE_COLORS.map((color) => (
                <button
                  key={color}
                  aria-label={`Stroke ${color}`}
                  className={cn(
                    "h-6 w-6 rounded-md border-2 transition-transform",
                    activeStroke === color ? "scale-110 border-foreground" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => applyStroke(color)}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Fill</p>
            <div className="flex gap-1.5">
              {FILL_COLORS.map((color) => (
                <button
                  key={color}
                  aria-label={`Fill ${color}`}
                  className={cn(
                    "h-6 w-6 rounded-md border-2 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,var(--border)_4px,var(--border)_5px)] transition-transform",
                    activeFill === color ? "scale-110 border-foreground" : "border-transparent"
                  )}
                  style={{ backgroundColor: color === "transparent" ? undefined : color }}
                  onClick={() => applyFill(color)}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Stroke width</p>
            <div className="flex gap-1.5">
              {STROKE_WIDTHS.map((width) => (
                <button
                  key={width}
                  aria-label={`Stroke width ${width}`}
                  className={cn(
                    "flex h-6 flex-1 items-center justify-center rounded-md border transition-colors",
                    activeWidth === width ? "border-foreground bg-muted" : "border-border"
                  )}
                  onClick={() => applyStrokeWidth(width)}
                >
                  <span className="w-4 rounded-full bg-foreground" style={{ height: width }} />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
