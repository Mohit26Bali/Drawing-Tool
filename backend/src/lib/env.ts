import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters (use a long random value)"),
  JWT_EXPIRES_IN: z.string().min(1).default("7d"),
  // Comma separated list of browser origins allowed to call the API and open sockets.
  CLIENT_URL: z.string().optional(),
  // How many reverse proxies sit in front of the app (Render, Vercel, nginx: 1). Needed for correct client IPs.
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
});

export interface AppConfig {
  nodeEnv: "development" | "test" | "production";
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  clientOrigins: string[];
  trustProxy: number;
}

function parseOrigins(value: string): string[] {
  const origins = value
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  for (const origin of origins) {
    try {
      const u = new URL(origin);
      if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("bad protocol");
    } catch {
      throw new Error(`CLIENT_URL contains an invalid origin: "${origin}"`);
    }
  }
  return origins;
}

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join(".") || "env"}: ${i.message}`);
    throw new Error(`Invalid environment configuration:\n${lines.join("\n")}\nSee backend/.env.example.`);
  }
  const env = parsed.data;

  let clientOrigins: string[];
  if (env.CLIENT_URL && env.CLIENT_URL.trim()) {
    clientOrigins = parseOrigins(env.CLIENT_URL);
  } else if (env.NODE_ENV === "production") {
    throw new Error("Invalid environment configuration:\n  - CLIENT_URL: required in production (the website's address)");
  } else {
    clientOrigins = ["http://localhost:3000"];
  }

  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    clientOrigins,
    trustProxy: env.TRUST_PROXY,
  };
}

let cached: AppConfig | null = null;

/** Validated configuration, read once. Throws a readable error when something is missing. */
export function config(): AppConfig {
  if (!cached) cached = loadConfig();
  return cached;
}
