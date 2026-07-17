import { describe, expect, it } from "vitest";
import { canManageAdministrators, canManageQuestionBank, hasAnyRole } from "@/modules/identity/domain/permissions";

describe("permissions", () => { it("allows administrators to manage the question bank", () => { expect(canManageQuestionBank("SUPER_ADMIN")).toBe(true); expect(canManageQuestionBank("ADMIN")).toBe(true); expect(canManageQuestionBank("STUDENT")).toBe(false); }); it("reserves administrator management for super admins", () => { expect(canManageAdministrators("SUPER_ADMIN")).toBe(true); expect(canManageAdministrators("ADMIN")).toBe(false); }); it("matches explicit role lists", () => expect(hasAnyRole("STUDENT", ["STUDENT"])).toBe(true)); });
