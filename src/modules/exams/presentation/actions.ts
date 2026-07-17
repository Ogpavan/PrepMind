"use server";

import { revalidatePath } from "next/cache";
import { assertRole } from "@/modules/identity/application/authorization";
import { examService } from "../application/exam-service";
import { toActionError, type ActionResult } from "@/shared/errors/application-error";

export async function saveExamAction(values: unknown): Promise<ActionResult> { try { const actor = await assertRole(["SUPER_ADMIN", "ADMIN"]); await examService.save(values, actor.id); revalidatePath("/admin/exams"); return { ok: true, data: undefined, message: "Exam saved." }; } catch (error) { return toActionError(error); } }
export async function toggleExamAction(id: string, active: boolean): Promise<ActionResult> { try { const actor = await assertRole(["SUPER_ADMIN", "ADMIN"]); await examService.toggle(id, active, actor.id); revalidatePath("/admin/exams"); return { ok: true, data: undefined, message: active ? "Exam activated." : "Exam deactivated." }; } catch (error) { return toActionError(error); } }
