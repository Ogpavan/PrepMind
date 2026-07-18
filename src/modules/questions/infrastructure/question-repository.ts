import { and, asc, count, desc, eq, ilike, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/infrastructure/database/client";
import { attempts, exams, questionOptions, questions, studySessionQuestions, subjects, topics } from "@/infrastructure/database/schema";
import { normalizePagination, type PaginationInput } from "@/shared/types/pagination";

const subtopics = alias(topics, "question_subtopics");
export type QuestionListItem = Pick<typeof questions.$inferSelect, "id" | "prompt" | "type" | "difficulty" | "isActive" | "archivedAt" | "createdAt" | "estimatedTimeSeconds"> & { examName: string; subjectName: string; topicName: string };
export type QuestionDetail = typeof questions.$inferSelect & { options: (typeof questionOptions.$inferSelect)[]; examName: string; subjectName: string; topicName: string; subtopicName: string | null };

export const questionRepository = {
  async list(input: PaginationInput & { examId?: string; subjectId?: string; topicId?: string; difficulty?: "easy" | "medium" | "hard"; status?: string; sort?: string } = {}) {
    const { page, pageSize, query } = normalizePagination(input); const filters = [query ? or(ilike(questions.prompt, `%${query}%`), ilike(questions.source, `%${query}%`)) : undefined, input.examId ? eq(questions.examId, input.examId) : undefined, input.subjectId ? eq(questions.subjectId, input.subjectId) : undefined, input.topicId ? eq(questions.topicId, input.topicId) : undefined, input.difficulty ? eq(questions.difficulty, input.difficulty) : undefined, input.status === "archived" ? isNotNull(questions.archivedAt) : input.status === "active" ? and(isNull(questions.archivedAt), eq(questions.isActive, true)) : input.status === "inactive" ? and(isNull(questions.archivedAt), eq(questions.isActive, false)) : undefined].filter(Boolean) as ReturnType<typeof eq>[]; const filter = filters.length ? and(...filters) : undefined;
    const order = input.sort === "oldest" ? asc(questions.createdAt) : input.sort === "difficulty" ? asc(questions.difficulty) : desc(questions.createdAt);
    const selection = { id: questions.id, prompt: questions.prompt, type: questions.type, difficulty: questions.difficulty, isActive: questions.isActive, archivedAt: questions.archivedAt, createdAt: questions.createdAt, estimatedTimeSeconds: questions.estimatedTimeSeconds, examName: exams.name, subjectName: subjects.name, topicName: topics.name };
    const [items, [totalRow]] = await Promise.all([db.select(selection).from(questions).innerJoin(exams, eq(questions.examId, exams.id)).innerJoin(subjects, eq(questions.subjectId, subjects.id)).innerJoin(topics, eq(questions.topicId, topics.id)).where(filter).orderBy(order).limit(pageSize).offset((page - 1) * pageSize), db.select({ value: count() }).from(questions).where(filter)]);
    return { items, page, pageSize, total: totalRow.value, totalPages: Math.max(1, Math.ceil(totalRow.value / pageSize)) };
  },
  async findById(id: string): Promise<QuestionDetail | null> { const [row] = await db.select({ question: questions, examName: exams.name, subjectName: subjects.name, topicName: topics.name, subtopicName: subtopics.name }).from(questions).innerJoin(exams, eq(questions.examId, exams.id)).innerJoin(subjects, eq(questions.subjectId, subjects.id)).innerJoin(topics, eq(questions.topicId, topics.id)).leftJoin(subtopics, eq(questions.subtopicId, subtopics.id)).where(eq(questions.id, id)).limit(1); if (!row) return null; const options = await db.select().from(questionOptions).where(eq(questionOptions.questionId, id)).orderBy(asc(questionOptions.displayOrder)); return { ...row.question, options, examName: row.examName, subjectName: row.subjectName, topicName: row.topicName, subtopicName: row.subtopicName }; },
  async save(questionId: string | undefined, values: Omit<typeof questions.$inferInsert, "id">, options: Array<Omit<typeof questionOptions.$inferInsert, "questionId">>) { return db.transaction(async (tx) => { let saved: typeof questions.$inferSelect; if (questionId) { const [updated] = await tx.update(questions).set(values).where(eq(questions.id, questionId)).returning(); if (!updated) return null; saved = updated; await tx.delete(questionOptions).where(eq(questionOptions.questionId, questionId)); } else { [saved] = await tx.insert(questions).values(values).returning(); } await tx.insert(questionOptions).values(options.map((option) => ({ ...option, questionId: saved.id }))); return saved; }); },
  async updateState(ids: string[], values: Partial<typeof questions.$inferInsert>) { if (!ids.length) return []; return db.update(questions).set(values).where(inArray(questions.id, ids)).returning(); },
  async findReferencedIds(ids: string[]) {
    if (!ids.length) return [];
    const [sessionReferences, attemptReferences] = await Promise.all([
      db.select({ id: studySessionQuestions.questionId }).from(studySessionQuestions).where(inArray(studySessionQuestions.questionId, ids)),
      db.select({ id: attempts.questionId }).from(attempts).where(inArray(attempts.questionId, ids)),
    ]);
    return [...new Set([...sessionReferences, ...attemptReferences].map((item) => item.id))];
  },
  async deleteMany(ids: string[]) { if (!ids.length) return []; return db.delete(questions).where(inArray(questions.id, ids)).returning({ id: questions.id }); },
  async countStats() { const [row] = await db.select({ total: count(), active: sql<number>`count(*) filter (where ${questions.isActive} = true and ${questions.archivedAt} is null)::int` }).from(questions); return row; },
  async recent(limit = 5) { return db.select({ id: questions.id, prompt: questions.prompt, difficulty: questions.difficulty, createdAt: questions.createdAt, subjectName: subjects.name }).from(questions).innerJoin(subjects, eq(questions.subjectId, subjects.id)).orderBy(desc(questions.createdAt)).limit(limit); },
};
