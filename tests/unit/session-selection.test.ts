import { describe, expect, it } from "vitest";
import { ensureSufficientQuestions } from "@/modules/study/domain/session-selection";

describe("session question selection", () => { it("allows an exact available count", () => expect(ensureSufficientQuestions(10, 10).ok).toBe(true)); it("returns a useful shortage message", () => { const result = ensureSufficientQuestions(3, 5); expect(result.ok).toBe(false); if (!result.ok) expect(result.message).toContain("Only 3"); }); });
