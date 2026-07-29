"use server";

import { revalidatePath } from "next/cache";
import { assertRole } from "@/modules/identity/application/authorization";
import { examService } from "../application/exam-service";
import { toActionError, type ActionResult } from "@/shared/errors/application-error";

export async function saveExamAction(values: unknown): Promise<ActionResult> { try { const actor = await assertRole(["SUPER_ADMIN", "ADMIN"]); await examService.save(values, actor.id); revalidatePath("/admin/exams"); return { ok: true, data: undefined, message: "Exam saved." }; } catch (error) { return toActionError(error); } }
export async function toggleExamAction(id: string, active: boolean): Promise<ActionResult> { try { const actor = await assertRole(["SUPER_ADMIN", "ADMIN"]); await examService.toggle(id, active, actor.id); revalidatePath("/admin/exams"); return { ok: true, data: undefined, message: active ? "Exam activated." : "Exam deactivated." }; } catch (error) { return toActionError(error); } }
export async function deleteExamAction(id: string): Promise<ActionResult> { try { await assertRole(["SUPER_ADMIN", "ADMIN"]); const summary = await examService.remove(id); revalidatePath("/admin/exams"); revalidatePath("/admin/subjects"); revalidatePath("/admin/topics"); revalidatePath("/admin/questions"); revalidatePath("/admin/dashboard"); return { ok: true, data: undefined, message: `Exam deleted with ${summary.subjects} subject${summary.subjects === 1 ? "" : "s"}, ${summary.topics} topic${summary.topics === 1 ? "" : "s"}, and ${summary.questions} question${summary.questions === 1 ? "" : "s"}.` }; } catch (error) { return toActionError(error); } }
