"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PhotoHero } from "@/components/landing/photo-hero";

export function Hero() {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-8">
      <PhotoHero>
        <div className="hero-text max-w-xl">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
          >
            A shared whiteboard
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-5 text-5xl leading-[1.05] sm:text-6xl lg:text-7xl"
          >
            Draw it out, <span className="chalk-underline">together</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-6 max-w-md text-lg leading-relaxed text-foreground/90"
          >
            Sketch shapes, arrows and notes on an endless board. Invite people by email, watch their cursors move as
            they work, and come back to any saved version.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition hover:brightness-110 active:translate-y-px"
            >
              Start drawing
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-xl border border-foreground/40 bg-background/50 px-6 py-3 text-base font-medium transition hover:border-foreground hover:bg-background/70"
            >
              I already have an account
            </Link>
          </motion.div>
        </div>
      </PhotoHero>
    </div>
  );
}
