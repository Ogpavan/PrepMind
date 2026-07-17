import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/infrastructure/database/client";
import { users } from "@/infrastructure/database/schema";
import { normalizePagination, type PaginationInput } from "@/shared/types/pagination";

export type UserListItem = Pick<typeof users.$inferSelect, "id" | "name" | "email" | "role" | "isActive" | "lastLoginAt" | "createdAt" | "updatedAt">;

export const userRepository = {
  async list(input: PaginationInput & { role?: "SUPER_ADMIN" | "ADMIN" | "STUDENT" } = {}) { const { page, pageSize, query } = normalizePagination(input); const search = query ? or(ilike(users.name, `%${query}%`), ilike(users.email, `%${query}%`)) : undefined; const filter = input.role ? search ? and(search, eq(users.role, input.role)) : eq(users.role, input.role) : search; const [items, [totalRow]] = await Promise.all([db.select({ id: users.id, name: users.name, email: users.email, role: users.role, isActive: users.isActive, lastLoginAt: users.lastLoginAt, createdAt: users.createdAt, updatedAt: users.updatedAt }).from(users).where(filter).orderBy(desc(users.createdAt)).limit(pageSize).offset((page - 1) * pageSize), db.select({ value: count() }).from(users).where(filter)]); return { items, page, pageSize, total: totalRow.value, totalPages: Math.max(1, Math.ceil(totalRow.value / pageSize)) }; },
  async findById(id: string) { const [item] = await db.select().from(users).where(eq(users.id, id)).limit(1); return item ?? null; },
  async create(values: typeof users.$inferInsert) { const [item] = await db.insert(users).values(values).returning(); return item; },
  async update(id: string, values: Partial<typeof users.$inferInsert>) { const [item] = await db.update(users).set(values).where(eq(users.id, id)).returning(); return item ?? null; },
  async countStudents() { const [row] = await db.select({ value: count() }).from(users).where(eq(users.role, "STUDENT")); return row.value; },
  async recentStudents(limit = 5) { return db.select({ id: users.id, name: users.name, email: users.email, lastLoginAt: users.lastLoginAt }).from(users).where(eq(users.role, "STUDENT")).orderBy(desc(users.lastLoginAt)).limit(limit); },
};
