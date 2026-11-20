"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    title: "Make an account",
    body: "Sign up with your name, an email and a password. That is all you need to start a board.",
  },
  {
    title: "Start a board",
    body: "Create a board and draw on it. Everything is saved as you go, so it is there when you come back.",
  },
  {
    title: "Invite people",
    body: "Open Share, type the email of someone who has an account, and choose whether they can edit or only look.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
      <h2 className="max-w-2xl text-4xl sm:text-5xl">How it works</h2>

      <ol className="mt-12 grid gap-8 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <motion.li
            key={step.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="relative"
          >
            <span
              aria-hidden="true"
              className="font-heading flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-primary text-3xl text-primary"
            >
              {i + 1}
            </span>
            <h3 className="mt-5 text-2xl">{step.title}</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">{step.body}</p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
