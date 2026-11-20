import type { NextFunction, Request, RequestHandler, Response } from "express";
import { Prisma } from "@prisma/client";

/** An error whose message is safe to show to the client. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Express 4 does not catch errors thrown inside async handlers: they become unhandled
 * promise rejections, which crash modern Node. Wrapping every async route sends them
 * to the error handler instead.
 */
export function asyncHandler(fn: AsyncRoute): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) return next(err);

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  const e = err as { type?: string; status?: number; statusCode?: number };
  if (e?.type === "entity.too.large") {
    return res.status(413).json({ error: "The request is too large" });
  }
  if (e?.type === "entity.parse.failed" || (err instanceof SyntaxError && "body" in err)) {
    return res.status(400).json({ error: "The request body is not valid JSON" });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return res.status(409).json({ error: "That already exists" });
    if (err.code === "P2025") return res.status(404).json({ error: "Not found" });
  }

  const status = e?.status ?? e?.statusCode;
  if (typeof status === "number" && status >= 400 && status < 500) {
    return res.status(status).json({ error: "The request could not be processed" });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({ error: "Internal server error" });
}
