"use client";

import type { CursorPosition } from "@/types/presence";
import type { Viewport } from "@/lib/geometry";
import { colorForUser } from "@/lib/user-color";

interface RemoteCursorsProps {
  cursors: Record<string, CursorPosition>;
  viewport: Viewport;
}

export function RemoteCursors({ cursors, viewport }: RemoteCursorsProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Object.values(cursors).map((cursor) => {
        const color = colorForUser(cursor.userId);
        const left = viewport.x + cursor.x * viewport.scale;
        const top = viewport.y + cursor.y * viewport.scale;
        return (
          <div
            key={cursor.userId}
            className="absolute transition-[left,top] duration-75"
            style={{ left, top }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M1 1l6.5 15 2.3-6.2L16 7.5 1 1z" fill={color} stroke="#1c2a26" strokeWidth="1" />
            </svg>
            <span
              className="ml-3 -mt-1 inline-block rounded-md px-1.5 py-0.5 text-xs font-semibold text-[#1c2a26] shadow"
              style={{ backgroundColor: color }}
            >
              {cursor.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
