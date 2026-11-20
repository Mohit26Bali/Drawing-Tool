"use client";

import { useState } from "react";
import Link from "next/link";
import { PencilLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLogin } from "@/hooks/use-auth";
import { getErrorMessage } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login.mutate(
      { email, password },
      { onError: (error) => toast.error(getErrorMessage(error)) }
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <Link href="/" className="flex items-center gap-2.5" aria-label="CanvasFlow home">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <PencilLine className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
        </span>
        <span className="font-heading text-3xl font-bold leading-none">CanvasFlow</span>
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to access your boards</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="mt-2" disabled={login.isPending}>
              {login.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
