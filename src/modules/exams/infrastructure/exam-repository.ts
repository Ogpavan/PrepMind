import { asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/infrastructure/database/client";
import { exams } from "@/infrastructure/database/schema";
import { normalizePagination, type PaginationInput } from "@/shared/types/pagination";

export const examRepository = {
  async list(input: PaginationInput = {}) {
    const { page, pageSize, query } = normalizePagination(input);
    const filter = query ? or(ilike(exams.name, `%${query}%`), ilike(exams.code, `%${query}%`)) : undefined;
    const [items, [totalRow]] = await Promise.all([
      db.select().from(exams).where(filter).orderBy(desc(exams.createdAt)).limit(pageSize).offset((page - 1) * pageSize),
      db.select({ value: count() }).from(exams).where(filter),
    ]);
    return { items, page, pageSize, total: totalRow.value, totalPages: Math.max(1, Math.ceil(totalRow.value / pageSize)) };
  },
  async listActive() { return db.select().from(exams).where(eq(exams.isActive, true)).orderBy(asc(exams.name)); },
  async findById(id: string) { const [item] = await db.select().from(exams).where(eq(exams.id, id)).limit(1); return item ?? null; },
  async create(values: typeof exams.$inferInsert) { const [item] = await db.insert(exams).values(values).returning(); return item; },
  async update(id: string, values: Partial<typeof exams.$inferInsert>) { const [item] = await db.update(exams).set(values).where(eq(exams.id, id)).returning(); return item ?? null; },
  async counts() { const [row] = await db.select({ total: count(), active: count(exams.id).mapWith(Number) }).from(exams); return row; },
};
