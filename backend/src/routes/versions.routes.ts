import { Router } from "express";
import { z } from "zod";
import { listVersions, createVersion, restoreVersion } from "../controllers/versions.controller";
import { validateBody } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../lib/http";

const router = Router();

const createVersionSchema = z.object({
  label: z.string().trim().max(100).optional(),
});

router.get("/boards/:boardId/versions", requireAuth, asyncHandler(listVersions));
router.post("/boards/:boardId/versions", requireAuth, validateBody(createVersionSchema), asyncHandler(createVersion));
router.post("/boards/:boardId/versions/:versionId/restore", requireAuth, asyncHandler(restoreVersion));

export default router;
