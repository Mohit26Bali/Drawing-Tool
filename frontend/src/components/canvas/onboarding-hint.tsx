"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "canvasflow-onboarding-seen";

export function OnboardingHint() {
  const [visible, setVisible] = useState(() => !localStorage.getItem(STORAGE_KEY));

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="onboarding-hint"
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute left-1/2 top-20 z-20 w-80 -translate-x-1/2 rounded-xl border bg-card p-4 shadow-xl"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold">Welcome to your canvas</p>
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ul className="mt-2.5 flex flex-col gap-1.5 text-xs text-muted-foreground">
            <li>
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground">R</kbd> rectangle ·{" "}
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground">O</kbd> ellipse ·{" "}
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground">T</kbd> text
            </li>
            <li>Drag empty space to pan, scroll to zoom</li>
            <li>Select a shape to comment on it or change its style</li>
          </ul>
          <Button size="sm" className="mt-3 w-full" onClick={dismiss}>
            Got it
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
