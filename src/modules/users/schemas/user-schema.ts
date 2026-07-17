import { z } from "zod";

export const userSchema = z.object({ id: z.uuid().optional(), name: z.string().trim().min(2).max(160), email: z.email().max(320), password: z.string().min(10).max(128).optional().or(z.literal("")), role: z.enum(["SUPER_ADMIN", "ADMIN", "STUDENT"]), isActive: z.boolean().default(true) }).superRefine((value, context) => { if (!value.id && !value.password) context.addIssue({ code: "custom", path: ["password"], message: "Password is required for a new user" }); });
export const profileSchema = z.object({ name: z.string().trim().min(2).max(160) });
export const passwordSchema = z.object({ currentPassword: z.string().min(8), newPassword: z.string().min(10).max(128), confirmPassword: z.string() }).refine((value) => value.newPassword === value.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });
