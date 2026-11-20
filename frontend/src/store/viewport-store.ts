import { create } from "zustand";

const MIN_SCALE = 0.1;
const MAX_SCALE = 4;

interface ViewportState {
  x: number;
  y: number;
  scale: number;
  setViewport: (viewport: Partial<{ x: number; y: number; scale: number }>) => void;
  zoomBy: (factor: number, center: { x: number; y: number }) => void;
  resetZoom: () => void;
}

export const useViewportStore = create<ViewportState>((set, get) => ({
  x: 0,
  y: 0,
  scale: 1,
  setViewport: (viewport) => set(viewport),
  zoomBy: (factor, center) => {
    const { x, y, scale } = get();
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));

    const worldX = (center.x - x) / scale;
    const worldY = (center.y - y) / scale;

    set({
      scale: newScale,
      x: center.x - worldX * newScale,
      y: center.y - worldY * newScale,
    });
  },
  resetZoom: () => set({ x: 0, y: 0, scale: 1 }),
}));
