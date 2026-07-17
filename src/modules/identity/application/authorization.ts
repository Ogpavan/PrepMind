import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ApplicationError } from "@/shared/errors/application-error";
import { hasAnyRole } from "../domain/permissions";

export type AppRole = "SUPER_ADMIN" | "ADMIN" | "STUDENT";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isActive) redirect("/unauthorized");
  return user;
}

export async function requireRole(roles: AppRole[]) {
  const user = await requireUser();
  if (!hasAnyRole(user.role, roles)) redirect("/forbidden");
  return user;
}

export async function assertRole(roles: AppRole[]) {
  const user = await getCurrentUser();
  if (!user) throw new ApplicationError("UNAUTHORIZED", "Please sign in to continue.");
  if (!user.isActive || !hasAnyRole(user.role, roles)) throw new ApplicationError("FORBIDDEN", "You do not have permission to perform this action.");
  return user;
}
