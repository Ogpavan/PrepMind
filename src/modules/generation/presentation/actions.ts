"use server";

import { revalidatePath } from "next/cache";
import { assertRole } from "@/modules/identity/application/authorization";
import { toActionError, type ActionResult } from "@/shared/errors/application-error";
import { generationService } from "../application/generation-service";

export async function generateTopicQuestionsAction(topicId: string, totalQuestions: number): Promise<ActionResult<{ logId: string; insertedQuestions: number }>> {
  try {
    const actor = await assertRole(["SUPER_ADMIN", "ADMIN"]);
    const result = await generationService.startForTopic({ topicId, totalQuestions }, actor.id);
    revalidatePath("/admin/questions");
    revalidatePath("/admin/topics");
    revalidatePath("/admin/logs");
    return { ok: true, data: { logId: result.logId, insertedQuestions: 0 }, message: "Generation started in the backend. Open Logs to monitor batches and rate-limit waits." };
  } catch (error) {
    revalidatePath("/admin/logs");
    return toActionError(error);
  }
}
