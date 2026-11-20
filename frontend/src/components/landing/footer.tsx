import Link from "next/link";
import { PencilLine } from "lucide-react";
import { HERO_PHOTOS } from "@/lib/hero-photos";

export function Footer() {
  const photographers = Array.from(new Map(HERO_PHOTOS.map((p) => [p.photographer, p.page])));

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PencilLine className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
          </span>
          <span className="font-heading text-xl font-bold leading-none">CanvasFlow</span>
        </Link>

        <nav aria-label="Account" className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/login" className="transition-colors hover:text-foreground">
            Sign in
          </Link>
          <Link href="/register" className="transition-colors hover:text-foreground">
            Create an account
          </Link>
        </nav>
      </div>

      <p className="mx-auto max-w-6xl px-6 pb-8 text-xs leading-relaxed text-muted-foreground">
        Photos from{" "}
        <a href="https://www.pexels.com" className="underline hover:text-foreground" target="_blank" rel="noopener noreferrer">
          Pexels
        </a>
        :{" "}
        {photographers.map(([name, page], i) => (
          <span key={name}>
            <a href={page} className="underline hover:text-foreground" target="_blank" rel="noopener noreferrer">
              {name}
            </a>
            {i < photographers.length - 1 ? ", " : "."}
          </span>
        ))}
      </p>
    </footer>
  );
}
