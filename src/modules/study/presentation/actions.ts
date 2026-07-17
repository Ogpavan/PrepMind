"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/modules/identity/application/authorization";
import { toActionError, type ActionResult } from "@/shared/errors/application-error";
import { studyService } from "../application/study-service";

export async function createSessionAction(values: unknown): Promise<ActionResult<{ id: string }>> { try { const user = await requireUser(); const session = await studyService.create(user.id, values); revalidatePath("/study"); return { ok: true, data: { id: session.id } }; } catch (error) { return toActionError(error); } }
export async function completeSessionAction(values: unknown): Promise<ActionResult> { try { const user = await requireUser(); await studyService.completeWithAnswers(user.id, values); revalidatePath("/dashboard"); revalidatePath("/progress"); return { ok: true, data: undefined, message: "Session completed." }; } catch (error) { return toActionError(error); } }
export async function abandonSessionAction(sessionId: string): Promise<ActionResult> { try { const user = await requireUser(); await studyService.abandon(sessionId, user.id); revalidatePath("/dashboard"); return { ok: true, data: undefined, message: "Session abandoned." }; } catch (error) { return toActionError(error); } }
