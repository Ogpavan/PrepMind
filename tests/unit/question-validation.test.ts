import { describe, expect, it } from "vitest";
import { validateQuestionRules } from "@/modules/questions/domain/validation";

const base = { examId: crypto.randomUUID(), subjectId: crypto.randomUUID(), topicId: crypto.randomUUID(), subtopicId: "", prompt: "What is the correct answer?", explanation: "Because it is.", difficulty: "easy", source: "", reference: "", tags: [], estimatedTimeSeconds: 60, isActive: true };
describe("question validation", () => {
  it("accepts exactly one correct option for single choice", () => { const result = validateQuestionRules({ ...base, type: "single_choice", options: [{ text: "A", isCorrect: true, displayOrder: 0 }, { text: "B", isCorrect: false, displayOrder: 1 }] }); expect(result.success).toBe(true); });
  it("rejects multiple correct options for single choice", () => { const result = validateQuestionRules({ ...base, type: "single_choice", options: [{ text: "A", isCorrect: true, displayOrder: 0 }, { text: "B", isCorrect: true, displayOrder: 1 }] }); expect(result.success).toBe(false); });
  it("requires canonical True and False options", () => { const valid = validateQuestionRules({ ...base, type: "true_false", options: [{ text: "True", isCorrect: true, displayOrder: 0 }, { text: "False", isCorrect: false, displayOrder: 1 }] }); const invalid = validateQuestionRules({ ...base, type: "true_false", options: [{ text: "Yes", isCorrect: true, displayOrder: 0 }, { text: "No", isCorrect: false, displayOrder: 1 }] }); expect(valid.success).toBe(true); expect(invalid.success).toBe(false); });
});
