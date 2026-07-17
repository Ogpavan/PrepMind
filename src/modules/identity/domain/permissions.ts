export type Role = "SUPER_ADMIN" | "ADMIN" | "STUDENT";

export function hasAnyRole(role: Role, allowed: Role[]) { return allowed.includes(role); }
export function canManageQuestionBank(role: Role) { return role === "SUPER_ADMIN" || role === "ADMIN"; }
export function canManageAdministrators(role: Role) { return role === "SUPER_ADMIN"; }
