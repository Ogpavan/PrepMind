"use server";

import { revalidatePath } from "next/cache";
import { assertRole, requireUser } from "@/modules/identity/application/authorization";
import { toActionError, type ActionResult } from "@/shared/errors/application-error";
import { userService } from "../application/user-service";

export async function saveUserAction(values: unknown): Promise<ActionResult> { try { const actor = await assertRole(["SUPER_ADMIN", "ADMIN"]); await userService.save(values, actor); revalidatePath("/admin/users"); return { ok: true, data: undefined, message: "User saved." }; } catch (error) { return toActionError(error); } }
export async function updateProfileAction(values: unknown): Promise<ActionResult> { try { const actor = await requireUser(); await userService.updateProfile(actor.id, values); revalidatePath("/settings"); return { ok: true, data: undefined, message: "Profile updated. Sign in again to refresh your display name." }; } catch (error) { return toActionError(error); } }
export async function changePasswordAction(values: unknown): Promise<ActionResult> { try { const actor = await requireUser(); await userService.changePassword(actor.id, values); return { ok: true, data: undefined, message: "Password changed." }; } catch (error) { return toActionError(error); } }
