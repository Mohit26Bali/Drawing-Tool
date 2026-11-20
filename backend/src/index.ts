import http from "http";
import { config } from "./lib/env";
import { prisma } from "./lib/prisma";
import { createApp } from "./app";
import { createSocketServer } from "./socket";

let cfg;
try {
  cfg = config();
} catch (err) {
  // A readable message instead of a stack trace, and no half-started server.
  console.error((err as Error).message);
  process.exit(1);
}

const app = createApp({ config: cfg });
const httpServer = http.createServer(app);
const io = createSocketServer(httpServer, cfg.clientOrigins);

httpServer.listen(cfg.port, () => {
  console.log(`Backend listening on port ${cfg.port} (${cfg.nodeEnv}), allowing ${cfg.clientOrigins.join(", ")}`);
});

// A failed promise somewhere must be logged, not silently ignored and not allowed to kill the process.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, shutting down`);
  const force = setTimeout(() => process.exit(1), 10_000);
  force.unref();
  try {
    await new Promise<void>((resolve) => io.close(() => resolve()));
    await prisma.$disconnect();
  } finally {
    process.exit(0);
  }
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
