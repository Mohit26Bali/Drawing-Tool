import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="chalk-frame flex flex-col items-center px-6 py-16 text-center">
        <h2 className="text-4xl sm:text-5xl">Got an idea? Put it on the board.</h2>
        <p className="mt-4 max-w-md text-lg text-muted-foreground">It takes a minute to sign up and start drawing.</p>
        <Link
          href="/register"
          className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition hover:brightness-110 active:translate-y-px"
        >
          Start drawing
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
