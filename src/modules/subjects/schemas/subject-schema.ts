import { z } from "zod";

export const subjectSchema = z.object({ id: z.uuid().optional(), examId: z.uuid("Select an exam"), name: z.string().trim().min(2).max(180), code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, hyphens, or underscores"), description: z.string().max(4000).default(""), displayOrder: z.coerce.number().int().min(0), isActive: z.boolean().default(true) });
export type SubjectInput = z.infer<typeof subjectSchema>;
