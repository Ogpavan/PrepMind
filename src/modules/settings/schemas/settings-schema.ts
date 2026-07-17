import { z } from "zod";

export const applicationSettingsSchema = z.object({ applicationName: z.string().trim().min(2).max(80), defaultQuestionCount: z.coerce.number().int().min(1).max(100), allowTimedSessions: z.boolean() });
export type ApplicationSettings = z.infer<typeof applicationSettingsSchema>;
