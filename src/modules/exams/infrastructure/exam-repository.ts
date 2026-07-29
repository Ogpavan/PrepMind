import { asc, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/infrastructure/database/client";
import { attempts, exams, questionOptions, questions, studySessionQuestions, studySessions, subjects, topics } from "@/infrastructure/database/schema";
import { normalizePagination, type PaginationInput } from "@/shared/types/pagination";

export type CatalogDeleteSummary = { exams: number; subjects: number; topics: number; questions: number; sessions: number; attempts: number };

async function deleteQuestionAndSessionData(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], questionIds: string[], sessionIds: string[]): Promise<Pick<CatalogDeleteSummary, "questions" | "sessions" | "attempts">> {
  const affectedQuestionIds = [...new Set(questionIds)];
  const affectedSessionIds = new Set(sessionIds);

  if (affectedQuestionIds.length) {
    const linkedSessions = await tx.select({ id: studySessionQuestions.sessionId }).from(studySessionQuestions).where(inArray(studySessionQuestions.questionId, affectedQuestionIds));
    linkedSessions.forEach((item) => affectedSessionIds.add(item.id));
  }

  const sessionIdList = [...affectedSessionIds];
  const attemptFilter = affectedQuestionIds.length && sessionIdList.length
    ? or(inArray(attempts.questionId, affectedQuestionIds), inArray(attempts.sessionId, sessionIdList))
    : affectedQuestionIds.length
      ? inArray(attempts.questionId, affectedQuestionIds)
      : sessionIdList.length
        ? inArray(attempts.sessionId, sessionIdList)
        : undefined;
  const sessionQuestionFilter = affectedQuestionIds.length && sessionIdList.length
    ? or(inArray(studySessionQuestions.questionId, affectedQuestionIds), inArray(studySessionQuestions.sessionId, sessionIdList))
    : affectedQuestionIds.length
      ? inArray(studySessionQuestions.questionId, affectedQuestionIds)
      : sessionIdList.length
        ? inArray(studySessionQuestions.sessionId, sessionIdList)
        : undefined;

  const deletedAttempts = attemptFilter ? await tx.delete(attempts).where(attemptFilter).returning({ id: attempts.id }) : [];
  if (sessionQuestionFilter) await tx.delete(studySessionQuestions).where(sessionQuestionFilter);
  const deletedSessions = sessionIdList.length ? await tx.delete(studySessions).where(inArray(studySessions.id, sessionIdList)).returning({ id: studySessions.id }) : [];
  if (affectedQuestionIds.length) await tx.delete(questionOptions).where(inArray(questionOptions.questionId, affectedQuestionIds));
  const deletedQuestions = affectedQuestionIds.length ? await tx.delete(questions).where(inArray(questions.id, affectedQuestionIds)).returning({ id: questions.id }) : [];

  return { questions: deletedQuestions.length, sessions: deletedSessions.length, attempts: deletedAttempts.length };
}

async function deleteTopicsByDepth(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], topicIds: string[]) {
  const remaining = new Set(topicIds);
  let deletedCount = 0;

  while (remaining.size) {
    const parentRows = await tx.select({ id: topics.id, parentTopicId: topics.parentTopicId }).from(topics).where(inArray(topics.id, [...remaining]));
    const parentIds = new Set(parentRows.map((topic) => topic.parentTopicId).filter((id): id is string => id !== null && remaining.has(id)));
    const leafIds = parentRows.map((topic) => topic.id).filter((id) => !parentIds.has(id));
    const batch = leafIds.length ? leafIds : [...remaining];
    const deleted = await tx.delete(topics).where(inArray(topics.id, batch)).returning({ id: topics.id });
    deleted.forEach((topic) => remaining.delete(topic.id));
    deletedCount += deleted.length;
    if (!deleted.length) break;
  }

  return deletedCount;
}

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
  async removeCascade(id: string): Promise<CatalogDeleteSummary | null> {
    return db.transaction(async (tx) => {
      const [exam] = await tx.select({ id: exams.id }).from(exams).where(eq(exams.id, id)).limit(1);
      if (!exam) return null;

      const subjectRows = await tx.select({ id: subjects.id }).from(subjects).where(eq(subjects.examId, id));
      const topicRows = await tx.select({ id: topics.id }).from(topics).innerJoin(subjects, eq(topics.subjectId, subjects.id)).where(eq(subjects.examId, id));
      const questionRows = await tx.select({ id: questions.id }).from(questions).where(eq(questions.examId, id));
      const sessionRows = await tx.select({ id: studySessions.id }).from(studySessions).where(eq(studySessions.examId, id));

      const cleanup = await deleteQuestionAndSessionData(tx, questionRows.map((item) => item.id), sessionRows.map((item) => item.id));
      const deletedTopics = topicRows.length ? await deleteTopicsByDepth(tx, topicRows.map((item) => item.id)) : 0;
      const deletedSubjects = subjectRows.length ? await tx.delete(subjects).where(inArray(subjects.id, subjectRows.map((item) => item.id))).returning({ id: subjects.id }) : [];
      const deletedExams = await tx.delete(exams).where(eq(exams.id, id)).returning({ id: exams.id });

      return { exams: deletedExams.length, subjects: deletedSubjects.length, topics: deletedTopics, ...cleanup };
    });
  },
  async removeSubjectCascade(id: string): Promise<CatalogDeleteSummary | null> {
    return db.transaction(async (tx) => {
      const [subject] = await tx.select({ id: subjects.id }).from(subjects).where(eq(subjects.id, id)).limit(1);
      if (!subject) return null;

      const topicRows = await tx.select({ id: topics.id }).from(topics).where(eq(topics.subjectId, id));
      const questionRows = await tx.select({ id: questions.id }).from(questions).where(eq(questions.subjectId, id));
      const sessionRows = await tx.select({ id: studySessions.id }).from(studySessions).where(eq(studySessions.subjectId, id));

      const cleanup = await deleteQuestionAndSessionData(tx, questionRows.map((item) => item.id), sessionRows.map((item) => item.id));
      const deletedTopics = topicRows.length ? await deleteTopicsByDepth(tx, topicRows.map((item) => item.id)) : 0;
      const deletedSubjects = await tx.delete(subjects).where(eq(subjects.id, id)).returning({ id: subjects.id });

      return { exams: 0, subjects: deletedSubjects.length, topics: deletedTopics, ...cleanup };
    });
  },
  async removeTopicCascade(id: string): Promise<CatalogDeleteSummary | null> {
    return db.transaction(async (tx) => {
      const [topic] = await tx.select({ id: topics.id, subjectId: topics.subjectId }).from(topics).where(eq(topics.id, id)).limit(1);
      if (!topic) return null;

      const topicRows = await tx.select({ id: topics.id, parentTopicId: topics.parentTopicId }).from(topics).where(eq(topics.subjectId, topic.subjectId));
      const topicIds = new Set([id]);
      let expanded = true;
      while (expanded) {
        expanded = false;
        for (const item of topicRows) {
          if (item.parentTopicId && topicIds.has(item.parentTopicId) && !topicIds.has(item.id)) {
            topicIds.add(item.id);
            expanded = true;
          }
        }
      }
      const ids = [...topicIds];
      const questionRows = await tx.select({ id: questions.id }).from(questions).where(or(inArray(questions.topicId, ids), inArray(questions.subtopicId, ids)));
      const sessionRows = await tx.select({ id: studySessions.id }).from(studySessions).where(inArray(studySessions.topicId, ids));

      const cleanup = await deleteQuestionAndSessionData(tx, questionRows.map((item) => item.id), sessionRows.map((item) => item.id));
      const deletedTopics = await deleteTopicsByDepth(tx, ids);

      return { exams: 0, subjects: 0, topics: deletedTopics, ...cleanup };
    });
  },
  async counts() { const [row] = await db.select({ total: count(), active: count(exams.id).mapWith(Number) }).from(exams); return row; },
};
