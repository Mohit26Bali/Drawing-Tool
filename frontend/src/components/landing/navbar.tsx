import Link from "next/link";
import { PencilLine } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PencilLine className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
          </span>
          <span className="font-heading text-2xl font-bold leading-none">CanvasFlow</span>
        </Link>

        <div className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">
            What you can do
          </a>
          <a href="#how" className="transition-colors hover:text-foreground">
            How it works
          </a>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110 active:translate-y-px"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}
