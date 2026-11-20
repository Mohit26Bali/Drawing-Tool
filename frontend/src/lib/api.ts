import axios from "axios";
import { useAuthStore } from "@/store/auth-store";
import { resetSocket } from "@/lib/socket";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // An expired or rejected token on any call except sign-in itself signs the person out.
    const isAuthCall = typeof error.config?.url === "string" && error.config.url.startsWith("/auth/") && error.config.url !== "/auth/me";
    if (error.response?.status === 401 && !isAuthCall) {
      resetSocket();
      useAuthStore.getState().clearAuth();
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data?.error) {
    return error.response.data.error as string;
  }
  return "Something went wrong. Please try again.";
}
