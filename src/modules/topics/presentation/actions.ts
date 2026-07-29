"use server";

import { revalidatePath } from "next/cache";
import { assertRole } from "@/modules/identity/application/authorization";
import { toActionError, type ActionResult } from "@/shared/errors/application-error";
import { topicService } from "../application/topic-service";

export async function saveTopicAction(values: unknown): Promise<ActionResult> { try { const actor = await assertRole(["SUPER_ADMIN", "ADMIN"]); await topicService.save(values, actor.id); revalidatePath("/admin/topics"); return { ok: true, data: undefined, message: "Topic saved." }; } catch (error) { return toActionError(error); } }
export async function toggleTopicAction(id: string, active: boolean): Promise<ActionResult> { try { const actor = await assertRole(["SUPER_ADMIN", "ADMIN"]); await topicService.toggle(id, active, actor.id); revalidatePath("/admin/topics"); return { ok: true, data: undefined, message: active ? "Topic activated." : "Topic deactivated." }; } catch (error) { return toActionError(error); } }
export async function deleteTopicAction(id: string): Promise<ActionResult> { try { await assertRole(["SUPER_ADMIN", "ADMIN"]); const summary = await topicService.remove(id); const childTopics = Math.max(0, summary.topics - 1); revalidatePath("/admin/topics"); revalidatePath("/admin/questions"); revalidatePath("/admin/dashboard"); return { ok: true, data: undefined, message: `Topic deleted with ${childTopics} child topic${childTopics === 1 ? "" : "s"} and ${summary.questions} question${summary.questions === 1 ? "" : "s"}.` }; } catch (error) { return toActionError(error); } }
