"use client";

import { useEffect, useRef, useState } from "react";
import type { TextCanvasShape } from "@/types/canvas";
import type { Viewport } from "@/lib/geometry";

interface TextEditorOverlayProps {
  shape: TextCanvasShape;
  viewport: Viewport;
  onCommit: (text: string) => void;
}

export function TextEditorOverlay({ shape, viewport, onCommit }: TextEditorOverlayProps) {
  const [value, setValue] = useState(shape.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus on the next frame, after the click that opened the editor has finished, or the browser takes focus back.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onCommit(value)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape") {
          onCommit(value);
        } else if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onCommit(value);
        }
      }}
      className="absolute resize-none border-none bg-transparent p-0 leading-tight outline-none"
      style={{
        left: viewport.x + shape.x * viewport.scale,
        top: viewport.y + shape.y * viewport.scale,
        width: shape.width * viewport.scale,
        fontSize: shape.fontSize * viewport.scale,
        color: shape.stroke,
        transform: `rotate(${shape.rotation}deg)`,
        transformOrigin: "top left",
        minHeight: shape.fontSize * viewport.scale * 1.4,
      }}
    />
  );
}
