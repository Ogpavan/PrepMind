import { z } from "zod";

export const progressFilterSchema = z.object({ examId: z.uuid().optional(), subjectId: z.uuid().optional(), from: z.iso.date().optional(), to: z.iso.date().optional() });
export type ProgressFilters = z.infer<typeof progressFilterSchema>;
