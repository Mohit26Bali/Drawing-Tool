import jwt from "jsonwebtoken";
import type { AuthUser } from "../types/express";
import { config } from "./env";

export function signToken(payload: AuthUser): string {
  const { jwtSecret, jwtExpiresIn } = config();
  return jwt.sign({ id: payload.id, email: payload.email }, jwtSecret, {
    algorithm: "HS256",
    expiresIn: jwtExpiresIn,
  } as jwt.SignOptions);
}

/** Throws when the token is missing, expired, tampered with or signed with another algorithm. */
export function verifyToken(token: string): AuthUser {
  const decoded = jwt.verify(token, config().jwtSecret, { algorithms: ["HS256"] });
  if (typeof decoded !== "object" || decoded === null || typeof decoded.id !== "string") {
    throw new Error("Malformed token payload");
  }
  return { id: decoded.id, email: typeof decoded.email === "string" ? decoded.email : "" };
}
