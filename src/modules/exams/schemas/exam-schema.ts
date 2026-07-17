import { z } from "zod";

export const examSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2).max(180),
  code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, hyphens, or underscores"),
  description: z.string().max(4000).default(""),
  totalMarks: z.coerce.number().int().positive(),
  targetScore: z.coerce.number().int().nonnegative(),
  durationMinutes: z.coerce.number().int().positive(),
  isActive: z.boolean().default(true),
}).refine((value) => value.targetScore <= value.totalMarks, { path: ["targetScore"], message: "Target score cannot exceed total marks" });

export type ExamInput = z.infer<typeof examSchema>;
