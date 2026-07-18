import { z } from "zod";

const topicNameSchema = z
  .string()
  .trim()
  .min(2, "Topic name must contain at least 2 characters")
  .max(180, "Topic name cannot exceed 180 characters")
  .refine((value) => /[\p{L}\p{N}]/u.test(value), "Topic name must include a letter or number")
  .refine((value) => !/[<>\u0000-\u001f\u007f]/u.test(value), "Topic name contains unsupported characters");

const displayOrderSchema = z.preprocess(
  (value) => value === "" || value === null ? undefined : value,
  z.coerce.number({ error: "Enter a display order" }).int("Display order must be a whole number").min(0, "Display order cannot be negative"),
);

export const topicSchema = z.object({
  id: z.uuid().optional(),
  subjectId: z.uuid("Select a subject"),
  parentTopicId: z.union([z.uuid(), z.literal("")]).nullish().transform((value) => value || null),
  name: topicNameSchema,
  description: z.string().max(4000, "Description cannot exceed 4000 characters").default(""),
  displayOrder: displayOrderSchema,
  isActive: z.boolean().default(true),
});
export type TopicInput = z.infer<typeof topicSchema>;
