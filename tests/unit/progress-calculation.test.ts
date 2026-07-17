import { describe, expect, it } from "vitest";
import { calculateAccuracy } from "@/modules/progress/domain/calculation";

describe("progress calculation", () => { it("calculates percentage accuracy", () => expect(calculateAccuracy(7, 10)).toBe(70)); it("returns zero when there are no attempted questions", () => expect(calculateAccuracy(0, 0)).toBe(0)); });
