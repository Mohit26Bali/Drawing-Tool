import { z } from "zod";

/** Limits that keep one board (and one request) from growing without bound. */
export const LIMITS = {
  shapesPerBoard: 5000,
  boardsPerUser: 200,
  membersPerBoard: 50,
  versionsPerBoard: 50,
  pointsPerShape: 20000,
  textLength: 5000,
  commentLength: 1000,
  titleLength: 100,
} as const;

/** Trimmed and lower-cased, so "A@x.com" and "a@x.com" are the same account. */
export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address").max(254);

/** bcrypt only uses the first 72 bytes, so longer passwords are rejected instead of silently cut. */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

export const titleSchema = z.string().trim().min(1, "Title is required").max(LIMITS.titleLength);

export const roleSchema = z.enum(["EDITOR", "VIEWER"]);

const coordinate = z.number().min(-1e7).max(1e7);
const colour = z.string().regex(/^[#(),.%\w\s-]{1,40}$/, "Invalid colour");

export const shapeSchema = z.object({
  id: z.uuid(),
  type: z.enum(["rectangle", "ellipse", "arrow", "freehand", "text"]),
  x: coordinate,
  y: coordinate,
  rotation: z.number().min(-36000).max(36000),
  stroke: colour,
  fill: colour,
  strokeWidth: z.number().min(0).max(200),
  width: coordinate.optional(),
  height: coordinate.optional(),
  points: z.array(coordinate).max(LIMITS.pointsPerShape).optional(),
  text: z.string().max(LIMITS.textLength).optional(),
  fontSize: z.number().min(1).max(1000).optional(),
});

export type ShapeInput = z.infer<typeof shapeSchema>;

export const cursorSchema = z.object({ x: coordinate, y: coordinate });
export const shapeIdsSchema = z.array(z.uuid()).min(1).max(1000);
