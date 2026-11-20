import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import type { AppConfig } from "./lib/env";
import { errorHandler, notFoundHandler } from "./lib/http";
import { prisma } from "./lib/prisma";
import authRoutes from "./routes/auth.routes";
import boardsRoutes from "./routes/boards.routes";
import commentsRoutes from "./routes/comments.routes";
import versionsRoutes from "./routes/versions.routes";

export interface AppOptions {
  config: AppConfig;
  /** Turn the request limits off (the automated tests make hundreds of requests from one address). */
  rateLimits?: boolean;
}

function limiter(windowMs: number, limit: number, message: string) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: message },
  });
}

export function createApp({ config, rateLimits = true }: AppOptions) {
  const app = express();
  app.disable("x-powered-by");
  if (config.trustProxy > 0) app.set("trust proxy", config.trustProxy);

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Requests without an Origin header (curl, server to server, health checks) are not browser cross-site calls.
        callback(null, !origin || config.clientOrigins.includes(origin));
      },
      methods: ["GET", "POST", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 600,
    }),
  );

  // Health checks stay outside the request limits so an uptime monitor never gets blocked.
  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/health/ready", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "ready" });
    } catch {
      res.status(503).json({ status: "database unavailable" });
    }
  });

  if (rateLimits) {
    app.use(limiter(60_000, 600, "Too many requests. Please slow down."));
    app.use("/auth/login", limiter(15 * 60_000, 20, "Too many sign-in attempts. Try again in a few minutes."));
    app.use("/auth/register", limiter(60 * 60_000, 15, "Too many sign-ups from this address. Try again later."));
  }

  // An exported board can be a few megabytes; everything else is small.
  app.use("/boards/import", express.json({ limit: "8mb" }));
  app.use(express.json({ limit: "200kb" }));

  app.use("/auth", authRoutes);
  app.use("/boards", boardsRoutes);
  app.use("/", commentsRoutes);
  app.use("/", versionsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
