import { z } from "zod";

export const createSessionSchema = z.object({ examId: z.uuid("Select an exam"), subjectId: z.union([z.uuid(), z.literal("")]).optional().transform((value) => value || null), topicId: z.union([z.uuid(), z.literal("")]).optional().transform((value) => value || null), questionCount: z.coerce.number().int().min(1).max(100), difficulty: z.union([z.enum(["easy", "medium", "hard"]), z.literal("")]).optional().transform((value) => value || null), isTimed: z.boolean().default(false), durationMinutes: z.coerce.number().int().min(1).max(300).optional() }).superRefine((value, context) => { if (value.isTimed && !value.durationMinutes) context.addIssue({ code: "custom", path: ["durationMinutes"], message: "Duration is required for a timed session" }); });
export const submitAnswerSchema = z.object({ sessionId: z.uuid(), sessionQuestionId: z.uuid(), selectedOptionIds: z.array(z.uuid()).max(12), responseTimeSeconds: z.coerce.number().int().min(0).max(3600), skip: z.boolean().default(false) });
export const completeSessionSchema = z.object({
  sessionId: z.uuid(),
  answers: z.array(submitAnswerSchema.omit({ sessionId: true })).max(100),
  timedOut: z.boolean().default(false),
}).superRefine((value, context) => {
  const ids = value.answers.map((answer) => answer.sessionQuestionId);
  if (new Set(ids).size !== ids.length) context.addIssue({ code: "custom", path: ["answers"], message: "A question can only be answered once" });
});
export type CreateSessionInput = z.output<typeof createSessionSchema>;
export type CompleteSessionInput = z.output<typeof completeSessionSchema>;
