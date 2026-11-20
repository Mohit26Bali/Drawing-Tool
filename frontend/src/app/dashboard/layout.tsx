"use client";

import Link from "next/link";
import { PencilLine } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/auth-store";
import { useLogout } from "@/hooks/use-auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <header className="flex h-16 items-center justify-between border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PencilLine className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span className="font-heading text-2xl font-bold leading-none">CanvasFlow</span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger aria-label="Account menu" className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </AuthGuard>
  );
}
