"use client";

import { MessageCircle } from "lucide-react";
import { useCanvasStore } from "@/store/canvas-store";
import { useBoardComments } from "@/hooks/use-comments";
import { getShapeBounds } from "@/lib/geometry";
import type { Viewport } from "@/lib/geometry";

interface CommentPinsProps {
  boardId: string;
  viewport: Viewport;
}

export function CommentPins({ boardId, viewport }: CommentPinsProps) {
  const shapes = useCanvasStore((s) => s.shapes);
  const setSelectedIds = useCanvasStore((s) => s.setSelectedIds);
  const { data: comments } = useBoardComments(boardId);

  if (!comments || comments.length === 0) return null;

  const countsByShape = new Map<string, number>();
  comments.forEach((c) => countsByShape.set(c.shapeId, (countsByShape.get(c.shapeId) ?? 0) + 1));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {shapes.map((shape) => {
        const count = countsByShape.get(shape.id);
        if (!count) return null;

        const bounds = getShapeBounds(shape);
        const left = viewport.x + bounds.x2 * viewport.scale;
        const top = viewport.y + bounds.y1 * viewport.scale;

        return (
          <button
            key={shape.id}
            className="pointer-events-auto absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-amber-500 px-2 py-1 text-xs font-medium text-white shadow"
            style={{ left, top }}
            onClick={() => setSelectedIds([shape.id])}
          >
            <MessageCircle className="h-3 w-3" />
            {count}
          </button>
        );
      })}
    </div>
  );
}
