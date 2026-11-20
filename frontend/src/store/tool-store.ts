import { create } from "zustand";
import type { ToolType } from "@/types/canvas";

interface ToolState {
  tool: ToolType;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  setTool: (tool: ToolType) => void;
  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
}

export const useToolStore = create<ToolState>((set) => ({
  tool: "select",
  strokeColor: "#f2efe6",
  fillColor: "transparent",
  strokeWidth: 2,
  setTool: (tool) => set({ tool }),
  setStrokeColor: (strokeColor) => set({ strokeColor }),
  setFillColor: (fillColor) => set({ fillColor }),
  setStrokeWidth: (strokeWidth) => set({ strokeWidth }),
}));
