import { and, asc, count, eq, ilike, or } from "drizzle-orm";
import { db } from "@/infrastructure/database/client";
import { exams, subjects } from "@/infrastructure/database/schema";
import { normalizePagination, type PaginationInput } from "@/shared/types/pagination";

export type SubjectListItem = typeof subjects.$inferSelect & { examName: string; examCode: string };

export const subjectRepository = {
  async list(input: PaginationInput & { examId?: string } = {}) {
    const { page, pageSize, query } = normalizePagination(input); const search = query ? or(ilike(subjects.name, `%${query}%`), ilike(subjects.code, `%${query}%`)) : undefined; const filter = input.examId ? search ? and(search, eq(subjects.examId, input.examId)) : eq(subjects.examId, input.examId) : search;
    const selection = { id: subjects.id, examId: subjects.examId, name: subjects.name, code: subjects.code, description: subjects.description, displayOrder: subjects.displayOrder, isActive: subjects.isActive, createdBy: subjects.createdBy, updatedBy: subjects.updatedBy, createdAt: subjects.createdAt, updatedAt: subjects.updatedAt, examName: exams.name, examCode: exams.code };
    const [items, [totalRow]] = await Promise.all([db.select(selection).from(subjects).innerJoin(exams, eq(subjects.examId, exams.id)).where(filter).orderBy(asc(exams.name), asc(subjects.displayOrder), asc(subjects.name)).limit(pageSize).offset((page - 1) * pageSize), db.select({ value: count() }).from(subjects).where(filter)]);
    return { items, page, pageSize, total: totalRow.value, totalPages: Math.max(1, Math.ceil(totalRow.value / pageSize)) };
  },
  async listByExam(examId: string, activeOnly = true) { return db.select().from(subjects).where(activeOnly ? and(eq(subjects.examId, examId), eq(subjects.isActive, true)) : eq(subjects.examId, examId)).orderBy(asc(subjects.displayOrder), asc(subjects.name)); },
  async findById(id: string) { const [item] = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1); return item ?? null; },
  async create(values: typeof subjects.$inferInsert) { const [item] = await db.insert(subjects).values(values).returning(); return item; },
  async update(id: string, values: Partial<typeof subjects.$inferInsert>) { const [item] = await db.update(subjects).set(values).where(eq(subjects.id, id)).returning(); return item ?? null; },
};
