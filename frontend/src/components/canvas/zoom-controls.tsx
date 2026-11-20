"use client";

import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useViewportStore } from "@/store/viewport-store";

interface ZoomControlsProps {
  viewportSize: { width: number; height: number };
}

export function ZoomControls({ viewportSize }: ZoomControlsProps) {
  const scale = useViewportStore((s) => s.scale);
  const zoomBy = useViewportStore((s) => s.zoomBy);
  const resetZoom = useViewportStore((s) => s.resetZoom);

  const center = { x: viewportSize.width / 2, y: viewportSize.height / 2 };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="absolute bottom-4 right-4 z-10 flex items-center gap-1 rounded-xl border bg-card p-1.5 shadow-lg"
    >
      <Button variant="ghost" size="icon" title="Zoom out" onClick={() => zoomBy(1 / 1.2, center)}>
        <Minus className="h-4 w-4" />
      </Button>
      <button
        className="w-14 text-center text-xs font-medium text-muted-foreground hover:text-foreground"
        title="Reset zoom"
        onClick={resetZoom}
      >
        {Math.round(scale * 100)}%
      </button>
      <Button variant="ghost" size="icon" title="Zoom in" onClick={() => zoomBy(1.2, center)}>
        <Plus className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}
