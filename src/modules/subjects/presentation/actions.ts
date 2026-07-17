"use server";

import { revalidatePath } from "next/cache";
import { assertRole } from "@/modules/identity/application/authorization";
import { toActionError, type ActionResult } from "@/shared/errors/application-error";
import { subjectService } from "../application/subject-service";

export async function saveSubjectAction(values: unknown): Promise<ActionResult> { try { const actor = await assertRole(["SUPER_ADMIN", "ADMIN"]); await subjectService.save(values, actor.id); revalidatePath("/admin/subjects"); return { ok: true, data: undefined, message: "Subject saved." }; } catch (error) { return toActionError(error); } }
export async function toggleSubjectAction(id: string, active: boolean): Promise<ActionResult> { try { const actor = await assertRole(["SUPER_ADMIN", "ADMIN"]); await subjectService.toggle(id, active, actor.id); revalidatePath("/admin/subjects"); return { ok: true, data: undefined, message: active ? "Subject activated." : "Subject deactivated." }; } catch (error) { return toActionError(error); } }
