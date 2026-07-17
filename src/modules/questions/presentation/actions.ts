"use server";

import { revalidatePath } from "next/cache";
import { assertRole } from "@/modules/identity/application/authorization";
import { toActionError, type ActionResult } from "@/shared/errors/application-error";
import { questionService } from "../application/question-service";

export async function saveQuestionAction(values: unknown): Promise<ActionResult<{ id: string }>> { try { const actor = await assertRole(["SUPER_ADMIN", "ADMIN"]); const item = await questionService.save(values, actor.id); revalidatePath("/admin/questions"); return { ok: true, data: { id: item.id }, message: "Question saved." }; } catch (error) { return toActionError(error); } }
export async function duplicateQuestionAction(id: string): Promise<ActionResult> { try { const actor = await assertRole(["SUPER_ADMIN", "ADMIN"]); await questionService.duplicate(id, actor.id); revalidatePath("/admin/questions"); return { ok: true, data: undefined, message: "Question duplicated as inactive." }; } catch (error) { return toActionError(error); } }
export async function archiveQuestionsAction(ids: string[]): Promise<ActionResult> { try { const actor = await assertRole(["SUPER_ADMIN", "ADMIN"]); await questionService.archive(ids, actor.id); revalidatePath("/admin/questions"); return { ok: true, data: undefined, message: `${ids.length} question${ids.length === 1 ? "" : "s"} archived.` }; } catch (error) { return toActionError(error); } }
export async function restoreQuestionsAction(ids: string[]): Promise<ActionResult> { try { const actor = await assertRole(["SUPER_ADMIN", "ADMIN"]); await questionService.restore(ids, actor.id); revalidatePath("/admin/questions"); return { ok: true, data: undefined, message: `${ids.length} question${ids.length === 1 ? "" : "s"} restored.` }; } catch (error) { return toActionError(error); } }
export async function activateQuestionsAction(ids: string[]): Promise<ActionResult> { try { const actor = await assertRole(["SUPER_ADMIN", "ADMIN"]); await questionService.activate(ids, actor.id); revalidatePath("/admin/questions"); return { ok: true, data: undefined, message: `${ids.length} question${ids.length === 1 ? "" : "s"} activated.` }; } catch (error) { return toActionError(error); } }
