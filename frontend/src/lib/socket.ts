import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth-store";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL, {
      autoConnect: false,
      auth: (cb) => cb({ token: useAuthStore.getState().token }),
    });
  }
  return socket;
}

/** Closes the connection and forgets it, so the next sign-in starts a fresh one with its own token. */
export function resetSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
