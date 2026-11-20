import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { resetSocket } from "@/lib/socket";
import { safeNextPath } from "@/lib/safe-redirect";
import type { User } from "@/types";

interface AuthResponse {
  token: string;
  user: User;
}

export function useRegister() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (data: { email: string; password: string; name: string }) => {
      const res = await api.post<AuthResponse>("/auth/register", data);
      return res.data;
    },
    onSuccess: (data) => {
      // A new session must never see the previous person's cached boards.
      queryClient.clear();
      resetSocket();
      setAuth(data.token, data.user);
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(safeNextPath(next));
    },
  });
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await api.post<AuthResponse>("/auth/login", data);
      return res.data;
    },
    onSuccess: (data) => {
      // A new session must never see the previous person's cached boards.
      queryClient.clear();
      resetSocket();
      setAuth(data.token, data.user);
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(safeNextPath(next));
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return () => {
    resetSocket();
    queryClient.clear();
    clearAuth();
    router.push("/login");
  };
}
