"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (hasHydrated && !token) {
      const target = pathname && pathname !== "/dashboard" ? `/login?next=${encodeURIComponent(pathname)}` : "/login";
      router.replace(target);
    }
  }, [hasHydrated, token, router, pathname]);

  if (!hasHydrated || !token) {
    return (
      <div className="flex min-h-screen flex-col gap-4 p-8" aria-busy="true" aria-label="Loading">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return <>{children}</>;
}
