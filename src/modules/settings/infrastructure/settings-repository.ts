import { eq } from "drizzle-orm";
import { db } from "@/infrastructure/database/client";
import { appSettings } from "@/infrastructure/database/schema";

export const settingsRepository = {
  async get(key: string) { const [row] = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1); return row?.value ?? null; },
  async set(key: string, value: unknown, actorId: string) { const [row] = await db.insert(appSettings).values({ key, value, updatedBy: actorId }).onConflictDoUpdate({ target: appSettings.key, set: { value, updatedBy: actorId, updatedAt: new Date() } }).returning(); return row; },
};
