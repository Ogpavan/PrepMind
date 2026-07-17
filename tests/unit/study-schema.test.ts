import { describe, expect, it } from "vitest";
import { completeSessionSchema } from "@/modules/study/schemas/study-schema";

const sessionId = crypto.randomUUID();
const sessionQuestionId = crypto.randomUUID();

describe("complete session answers", () => {
  it("accepts a batch of locally collected answers", () => {
    const result = completeSessionSchema.safeParse({
      sessionId,
      answers: [{ sessionQuestionId, selectedOptionIds: [crypto.randomUUID()], responseTimeSeconds: 4, skip: false }],
      timedOut: false,
    });

    expect(result.success).toBe(true);
  });

  it("rejects duplicate answers for the same question", () => {
    const answer = { sessionQuestionId, selectedOptionIds: [], responseTimeSeconds: 2, skip: true };
    const result = completeSessionSchema.safeParse({ sessionId, answers: [answer, answer], timedOut: false });

    expect(result.success).toBe(false);
  });
});
