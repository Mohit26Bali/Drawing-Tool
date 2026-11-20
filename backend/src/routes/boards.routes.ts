import { Router } from "express";
import { z } from "zod";
import {
  listBoards,
  createBoard,
  getBoard,
  updateBoard,
  deleteBoard,
  importBoard,
} from "../controllers/boards.controller";
import { listMembers, addMember, updateMember, removeMember } from "../controllers/members.controller";
import { validateBody } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../lib/http";
import { LIMITS, emailSchema, roleSchema, shapeSchema, titleSchema } from "../lib/schemas";

const router = Router();

const createBoardSchema = z.object({ title: titleSchema });
const updateBoardSchema = z.object({ title: titleSchema });

const importBoardSchema = z.object({
  title: titleSchema,
  shapes: z.array(shapeSchema).max(LIMITS.shapesPerBoard, "Too many shapes to import"),
});

const addMemberSchema = z.object({ email: emailSchema, role: roleSchema.default("EDITOR") });
const updateMemberSchema = z.object({ role: roleSchema });

router.use(requireAuth);

router.get("/", asyncHandler(listBoards));
router.post("/", validateBody(createBoardSchema), asyncHandler(createBoard));
// (the app accepts a larger body for this one route, because an export can be several megabytes)
router.post("/import", validateBody(importBoardSchema), asyncHandler(importBoard));
router.get("/:id", asyncHandler(getBoard));
router.patch("/:id", validateBody(updateBoardSchema), asyncHandler(updateBoard));
router.delete("/:id", asyncHandler(deleteBoard));

router.get("/:id/members", asyncHandler(listMembers));
router.post("/:id/members", validateBody(addMemberSchema), asyncHandler(addMember));
router.patch("/:id/members/:userId", validateBody(updateMemberSchema), asyncHandler(updateMember));
router.delete("/:id/members/:userId", asyncHandler(removeMember));

export default router;
