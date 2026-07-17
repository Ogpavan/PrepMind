import { describe, expect, it } from "vitest";
import { calculateCorrectness } from "@/modules/questions/domain/correctness";

describe("answer correctness", () => { it("ignores option order", () => expect(calculateCorrectness(["b", "a"], ["a", "b"])).toBe(true)); it("rejects partial and extra selections", () => { expect(calculateCorrectness(["a"], ["a", "b"])).toBe(false); expect(calculateCorrectness(["a", "b"], ["a"])).toBe(false); }); });
