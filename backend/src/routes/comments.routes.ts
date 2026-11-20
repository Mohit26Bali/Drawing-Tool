import { Router } from "express";
import { z } from "zod";
import { listBoardComments, createComment, deleteComment } from "../controllers/comments.controller";
import { validateBody } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../lib/http";
import { LIMITS } from "../lib/schemas";

const router = Router();

const createCommentSchema = z.object({
  shapeId: z.uuid(),
  text: z.string().trim().min(1, "Comment cannot be empty").max(LIMITS.commentLength),
});

router.get("/boards/:boardId/comments", requireAuth, asyncHandler(listBoardComments));
router.post("/boards/:boardId/comments", requireAuth, validateBody(createCommentSchema), asyncHandler(createComment));
router.delete("/comments/:id", requireAuth, asyncHandler(deleteComment));

export default router;
