import { and, asc, count, eq, ilike } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/infrastructure/database/client";
import { exams, subjects, topics } from "@/infrastructure/database/schema";
import { normalizePagination, type PaginationInput } from "@/shared/types/pagination";

const parents = alias(topics, "parent_topics");
export type TopicListItem = typeof topics.$inferSelect & { subjectName: string; subjectCode: string; examId: string; examName: string; parentName: string | null };

export const topicRepository = {
  async list(input: PaginationInput & { examId?: string; subjectId?: string } = {}) {
    const { page, pageSize, query } = normalizePagination(input); const filters = [query ? ilike(topics.name, `%${query}%`) : undefined, input.subjectId ? eq(topics.subjectId, input.subjectId) : undefined, input.examId ? eq(subjects.examId, input.examId) : undefined].filter(Boolean) as ReturnType<typeof eq>[]; const filter = filters.length ? and(...filters) : undefined;
    const selection = { id: topics.id, subjectId: topics.subjectId, parentTopicId: topics.parentTopicId, name: topics.name, description: topics.description, displayOrder: topics.displayOrder, isActive: topics.isActive, createdBy: topics.createdBy, updatedBy: topics.updatedBy, createdAt: topics.createdAt, updatedAt: topics.updatedAt, subjectName: subjects.name, subjectCode: subjects.code, examId: exams.id, examName: exams.name, parentName: parents.name };
    const baseCount = db.select({ value: count() }).from(topics).innerJoin(subjects, eq(topics.subjectId, subjects.id));
    const [items, [totalRow]] = await Promise.all([db.select(selection).from(topics).innerJoin(subjects, eq(topics.subjectId, subjects.id)).innerJoin(exams, eq(subjects.examId, exams.id)).leftJoin(parents, eq(topics.parentTopicId, parents.id)).where(filter).orderBy(asc(exams.name), asc(subjects.displayOrder), asc(topics.displayOrder), asc(topics.name)).limit(pageSize).offset((page - 1) * pageSize), baseCount.where(filter)]);
    return { items, page, pageSize, total: totalRow.value, totalPages: Math.max(1, Math.ceil(totalRow.value / pageSize)) };
  },
  async listBySubject(subjectId: string, activeOnly = true) { return db.select().from(topics).where(activeOnly ? and(eq(topics.subjectId, subjectId), eq(topics.isActive, true)) : eq(topics.subjectId, subjectId)).orderBy(asc(topics.displayOrder), asc(topics.name)); },
  async listReference() { return db.select({ id: topics.id, name: topics.name, subjectId: topics.subjectId, parentTopicId: topics.parentTopicId }).from(topics).orderBy(asc(topics.name)); },
  async findById(id: string) { const [item] = await db.select().from(topics).where(eq(topics.id, id)).limit(1); return item ?? null; },
  async create(values: typeof topics.$inferInsert) { const [item] = await db.insert(topics).values(values).returning(); return item; },
  async update(id: string, values: Partial<typeof topics.$inferInsert>) { const [item] = await db.update(topics).set(values).where(eq(topics.id, id)).returning(); return item ?? null; },
};
