import { Router } from "express";
import { z } from "zod";
import { register, login, me } from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../lib/http";
import { emailSchema, passwordSchema } from "../lib/schemas";

const router = Router();

const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1, "Name is required").max(80),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(200),
});

router.post("/register", validateBody(registerSchema), asyncHandler(register));
router.post("/login", validateBody(loginSchema), asyncHandler(login));
router.get("/me", requireAuth, asyncHandler(me));

export default router;
