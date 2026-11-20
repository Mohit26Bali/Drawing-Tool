"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (hasHydrated && token) {
      router.replace("/dashboard");
    }
  }, [hasHydrated, token, router]);

  if (hasHydrated && token) {
    return null;
  }

  return (
    <div className="relative min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
