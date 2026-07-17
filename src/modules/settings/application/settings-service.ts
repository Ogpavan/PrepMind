import { ApplicationError } from "@/shared/errors/application-error";
import { settingsRepository } from "../infrastructure/settings-repository";
import { applicationSettingsSchema, type ApplicationSettings } from "../schemas/settings-schema";

const defaults: ApplicationSettings = { applicationName: "PrepMind", defaultQuestionCount: 10, allowTimedSessions: true };
export const settingsService = {
  async getApplicationSettings() { const value = await settingsRepository.get("application"); const parsed = applicationSettingsSchema.safeParse(value); return parsed.success ? parsed.data : defaults; },
  async saveApplicationSettings(raw: unknown, actorId: string) { const parsed = applicationSettingsSchema.safeParse(raw); if (!parsed.success) throw new ApplicationError("VALIDATION", "Check the highlighted fields.", parsed.error.flatten().fieldErrors); return settingsRepository.set("application", parsed.data, actorId); },
};
