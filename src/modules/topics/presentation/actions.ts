"use server";

import { revalidatePath } from "next/cache";
import { assertRole } from "@/modules/identity/application/authorization";
import { toActionError, type ActionResult } from "@/shared/errors/application-error";
import { topicService } from "../application/topic-service";

export async function saveTopicAction(values: unknown): Promise<ActionResult> { try { const actor = await assertRole(["SUPER_ADMIN", "ADMIN"]); await topicService.save(values, actor.id); revalidatePath("/admin/topics"); return { ok: true, data: undefined, message: "Topic saved." }; } catch (error) { return toActionError(error); } }
export async function toggleTopicAction(id: string, active: boolean): Promise<ActionResult> { try { const actor = await assertRole(["SUPER_ADMIN", "ADMIN"]); await topicService.toggle(id, active, actor.id); revalidatePath("/admin/topics"); return { ok: true, data: undefined, message: active ? "Topic activated." : "Topic deactivated." }; } catch (error) { return toActionError(error); } }
