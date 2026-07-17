import { z } from "zod";

export const topicSchema = z.object({ id: z.uuid().optional(), subjectId: z.uuid("Select a subject"), parentTopicId: z.union([z.uuid(), z.literal("")]).optional().transform((value) => value || null), name: z.string().trim().min(2).max(180), description: z.string().max(4000).default(""), displayOrder: z.coerce.number().int().min(0), isActive: z.boolean().default(true) });
export type TopicInput = z.infer<typeof topicSchema>;
