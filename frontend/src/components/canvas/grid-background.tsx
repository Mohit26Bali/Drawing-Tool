"use client";

import { useViewportStore } from "@/store/viewport-store";

const GRID_SIZE = 32;

export function GridBackground() {
  const { x, y, scale } = useViewportStore();

  const size = GRID_SIZE * scale;
  const offsetX = x % size;
  const offsetY = y % size;

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          "radial-gradient(circle, color-mix(in oklch, var(--foreground), transparent 82%) 1px, transparent 1px)",
        backgroundSize: `${size}px ${size}px`,
        backgroundPosition: `${offsetX}px ${offsetY}px`,
      }}
    />
  );
}
