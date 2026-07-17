"use server";

import { revalidatePath } from "next/cache";
import { assertRole } from "@/modules/identity/application/authorization";
import { toActionError, type ActionResult } from "@/shared/errors/application-error";
import { settingsService } from "../application/settings-service";

export async function saveApplicationSettingsAction(values: unknown): Promise<ActionResult> { try { const actor = await assertRole(["SUPER_ADMIN"]); await settingsService.saveApplicationSettings(values, actor.id); revalidatePath("/admin/settings"); return { ok: true, data: undefined, message: "Application settings saved." }; } catch (error) { return toActionError(error); } }
