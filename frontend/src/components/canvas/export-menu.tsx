"use client";

import Konva from "konva";
import { toast } from "sonner";
import { Download, FileJson, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCanvasStore } from "@/store/canvas-store";
import { getShapeBounds } from "@/lib/geometry";
import { downloadJSON, downloadUrl, slugify } from "@/lib/export";

interface ExportMenuProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  layerRef: React.RefObject<Konva.Layer | null>;
  title: string;
}

const EXPORT_PADDING = 40;
const EXPORT_BACKGROUND = "#111113";

export function ExportMenu({ stageRef, layerRef, title }: ExportMenuProps) {
  const shapes = useCanvasStore((s) => s.shapes);

  function handleExportPNG() {
    const stage = stageRef.current;
    const layer = layerRef.current;
    if (!stage || !layer || shapes.length === 0) {
      toast.error("Nothing to export yet");
      return;
    }

    const bounds = shapes.reduce(
      (acc, shape) => {
        const b = getShapeBounds(shape);
        return {
          x1: Math.min(acc.x1, b.x1),
          y1: Math.min(acc.y1, b.y1),
          x2: Math.max(acc.x2, b.x2),
          y2: Math.max(acc.y2, b.y2),
        };
      },
      { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity }
    );

    const x = bounds.x1 - EXPORT_PADDING;
    const y = bounds.y1 - EXPORT_PADDING;
    const width = bounds.x2 - bounds.x1 + EXPORT_PADDING * 2;
    const height = bounds.y2 - bounds.y1 + EXPORT_PADDING * 2;

    const prevWidth = stage.width();
    const prevHeight = stage.height();
    const prevPosition = stage.position();
    const prevScale = stage.scale();
    const transformer = stage.findOne("Transformer");
    const prevTransformerVisible = transformer?.visible();
    transformer?.visible(false);

    const background = new Konva.Rect({ x, y, width, height, fill: EXPORT_BACKGROUND });
    layer.add(background);
    background.moveToBottom();

    stage.width(width);
    stage.height(height);
    stage.position({ x: -x, y: -y });
    stage.scale({ x: 1, y: 1 });
    layer.batchDraw();

    const dataUrl = stage.toDataURL({ pixelRatio: 2, mimeType: "image/png" });

    background.destroy();
    stage.width(prevWidth);
    stage.height(prevHeight);
    stage.position(prevPosition);
    stage.scale(prevScale);
    if (transformer && prevTransformerVisible !== undefined) transformer.visible(prevTransformerVisible);
    layer.batchDraw();

    downloadUrl(dataUrl, `${slugify(title)}.png`);
    toast.success("Exported as PNG");
  }

  function handleExportJSON() {
    if (shapes.length === 0) {
      toast.error("Nothing to export yet");
      return;
    }
    downloadJSON({ title, exportedAt: new Date().toISOString(), shapes }, `${slugify(title)}.json`);
    toast.success("Exported as JSON");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPNG}>
          <ImageIcon className="mr-2 h-4 w-4" />
          Export as PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON}>
          <FileJson className="mr-2 h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
