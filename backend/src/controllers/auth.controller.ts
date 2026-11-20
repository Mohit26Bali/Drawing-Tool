import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { HttpError } from "../lib/http";

// Production uses a deliberately slow hash. Tests use a cheap one so the suite stays fast.
const SALT_ROUNDS = process.env.NODE_ENV === "test" ? 4 : 12;

// Compared against when the email is unknown, so a wrong email and a wrong password take the same time.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", SALT_ROUNDS);

function publicUser(user: { id: string; email: string; name: string }) {
  return { id: user.id, email: user.email, name: user.name };
}

export async function register(req: Request, res: Response) {
  const { email, password, name } = req.body as { email: string; password: string; name: string };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError(409, "An account with this email already exists");
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  // Two sign-ups racing for the same email: the unique index makes the loser fail with P2002,
  // which the error handler turns into the same 409 instead of crashing.
  const user = await prisma.user.create({ data: { email, password: hashed, name } });

  const token = signToken({ id: user.id, email: user.email });
  res.status(201).json({ token, user: publicUser(user) });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
  if (!user || !valid) {
    throw new HttpError(401, "Invalid email or password");
  }

  const token = signToken({ id: user.id, email: user.email });
  res.json({ token, user: publicUser(user) });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  res.json({ user });
}
