import { z } from "zod";

export const questionOptionSchema = z.object({ id: z.uuid().optional(), text: z.string().trim().min(1, "Option text is required").max(2000), isCorrect: z.boolean(), displayOrder: z.number().int().min(0) });
export const questionSchema = z.object({
  id: z.uuid().optional(), examId: z.uuid("Select an exam"), subjectId: z.uuid("Select a subject"), topicId: z.uuid("Select a topic"), subtopicId: z.union([z.uuid(), z.literal(""), z.null()]).optional().transform((value) => value || null),
  type: z.enum(["single_choice", "multiple_choice", "true_false"]), prompt: z.string().trim().min(5, "Question must contain at least 5 characters").max(20000), options: z.array(questionOptionSchema).min(2, "Add at least two options").max(12), explanation: z.string().max(20000).default(""), difficulty: z.enum(["easy", "medium", "hard"]), source: z.string().max(240).default(""), reference: z.string().max(500).default(""), tags: z.array(z.string().trim().min(1).max(60)).max(20).default([]), estimatedTimeSeconds: z.coerce.number().int().positive("Estimated time must be greater than zero").max(3600), isActive: z.boolean().default(true),
}).superRefine((value, context) => {
  const correct = value.options.filter((option) => option.isCorrect).length;
  if (value.type === "single_choice" && correct !== 1) context.addIssue({ code: "custom", path: ["options"], message: "Single-choice questions require exactly one correct option" });
  if (value.type === "multiple_choice" && correct < 1) context.addIssue({ code: "custom", path: ["options"], message: "Multiple-choice questions require at least one correct option" });
  if (value.type === "true_false") { const labels = value.options.map((option) => option.text.toLowerCase()).sort(); if (value.options.length !== 2 || labels[0] !== "false" || labels[1] !== "true") context.addIssue({ code: "custom", path: ["options"], message: "True/false questions must contain exactly True and False options" }); if (correct !== 1) context.addIssue({ code: "custom", path: ["options"], message: "Select either True or False as correct" }); }
});
export type QuestionInput = z.input<typeof questionSchema>;
export type ParsedQuestionInput = z.output<typeof questionSchema>;
