"use client";

import { motion } from "framer-motion";
import { Download, History, Keyboard, MessageSquare, PencilRuler, Users } from "lucide-react";

// Everything listed here exists in the app today.
const FEATURES = [
  {
    icon: PencilRuler,
    title: "Five drawing tools",
    body: "Rectangles, ellipses, arrows, freehand lines and text. Select, move, resize and rotate them, with undo and redo, and pan and zoom around the board.",
  },
  {
    icon: Users,
    title: "Draw together, live",
    body: "Shapes appear as other people draw them, and you can see where their cursors are. Invite people by email as editors or viewers.",
  },
  {
    icon: MessageSquare,
    title: "Comments on shapes",
    body: "Pin a comment to any shape so feedback stays next to the thing it is about.",
  },
  {
    icon: History,
    title: "Saved versions",
    body: "Save a snapshot whenever you like and restore it later. Restoring keeps a copy of how the board looked first, so nothing is lost.",
  },
  {
    icon: Download,
    title: "Export and import",
    body: "Download a board as a PNG picture or a JSON file, and drop a JSON file back in to bring a board back.",
  },
  {
    icon: Keyboard,
    title: "Keyboard shortcuts",
    body: "V select, H pan, R rectangle, O ellipse, A arrow, F freehand, T text, Delete to remove, Ctrl+Z to undo.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
      <div className="max-w-2xl">
        <h2 className="text-4xl sm:text-5xl">What you can do</h2>
        <p className="mt-4 text-lg text-muted-foreground">Simple tools for thinking things through with other people.</p>
      </div>

      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }, i) => (
          <motion.li
            key={title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: Math.min(i, 5) * 0.05 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-2xl">{title}</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">{body}</p>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
