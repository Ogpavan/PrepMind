import { and, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/infrastructure/database/client";
import { exams, questionOptions, questions, subjects, topics } from "@/infrastructure/database/schema";
import { ApplicationError } from "@/shared/errors/application-error";
import type { QuestionImportRow } from "../domain/question-csv-import";

export type QuestionImportSummary = {
  questionsImported: number;
  examsCreated: number;
  subjectsCreated: number;
  topicsCreated: number;
  subtopicsCreated: number;
};

const sameText = (left: string, right: string) => left.trim().toLocaleLowerCase() === right.trim().toLocaleLowerCase();
const rowError = (row: number, message: string) => new ApplicationError("VALIDATION", `Import stopped at row ${row}.`, { [`Row ${row}`]: [message] });

export const questionImportRepository = {
  import(rows: QuestionImportRow[], actorId: string) {
    return db.transaction(async (tx): Promise<QuestionImportSummary> => {
      const summary: QuestionImportSummary = { questionsImported: 0, examsCreated: 0, subjectsCreated: 0, topicsCreated: 0, subtopicsCreated: 0 };
      const examCache = new Map<string, typeof exams.$inferSelect>();
      const subjectCache = new Map<string, typeof subjects.$inferSelect>();
      const topicCache = new Map<string, typeof topics.$inferSelect>();

      const resolveExam = async (row: QuestionImportRow) => {
        const key = row.exam.code.toLocaleLowerCase();
        const cached = examCache.get(key);
        if (cached) {
          if (!sameText(cached.name, row.exam.name)) throw rowError(row.rowNumber, `Exam code ${row.exam.code} is already associated with “${cached.name}”.`);
          return cached;
        }

        const [existing] = await tx.select().from(exams).where(or(
          sql`lower(${exams.code}) = ${key}`,
          sql`lower(${exams.name}) = ${row.exam.name.toLocaleLowerCase()}`,
        )).limit(1);
        if (existing) {
          if (!sameText(existing.code, row.exam.code) || !sameText(existing.name, row.exam.name)) throw rowError(row.rowNumber, `Exam name/code conflicts with existing exam “${existing.name}” (${existing.code}).`);
          examCache.set(key, existing);
          return existing;
        }

        const [created] = await tx.insert(exams).values({
          code: row.exam.code,
          name: row.exam.name,
          totalMarks: row.exam.totalMarks,
          targetScore: row.exam.targetScore,
          durationMinutes: row.exam.durationMinutes,
          description: "",
          isActive: true,
          createdBy: actorId,
          updatedBy: actorId,
        }).returning();
        summary.examsCreated += 1;
        examCache.set(key, created);
        return created;
      };

      const resolveSubject = async (row: QuestionImportRow, examId: string) => {
        const key = `${examId}:${row.subject.code.toLocaleLowerCase()}`;
        const cached = subjectCache.get(key);
        if (cached) {
          if (!sameText(cached.name, row.subject.name)) throw rowError(row.rowNumber, `Subject code ${row.subject.code} is already associated with “${cached.name}”.`);
          return cached;
        }

        const [existing] = await tx.select().from(subjects).where(and(
          eq(subjects.examId, examId),
          or(
            sql`lower(${subjects.code}) = ${row.subject.code.toLocaleLowerCase()}`,
            sql`lower(${subjects.name}) = ${row.subject.name.toLocaleLowerCase()}`,
          ),
        )).limit(1);
        if (existing) {
          if (!sameText(existing.code, row.subject.code) || !sameText(existing.name, row.subject.name)) throw rowError(row.rowNumber, `Subject name/code conflicts with existing subject “${existing.name}” (${existing.code}).`);
          subjectCache.set(key, existing);
          return existing;
        }

        const [created] = await tx.insert(subjects).values({
          examId,
          code: row.subject.code,
          name: row.subject.name,
          description: "",
          displayOrder: 0,
          isActive: true,
          createdBy: actorId,
          updatedBy: actorId,
        }).returning();
        summary.subjectsCreated += 1;
        subjectCache.set(key, created);
        return created;
      };

      const resolveTopic = async (row: QuestionImportRow, subjectId: string, parentTopicId: string | null, topicName: string) => {
        const key = `${subjectId}:${parentTopicId ?? "root"}:${topicName.toLocaleLowerCase()}`;
        const cached = topicCache.get(key);
        if (cached) return cached;

        const [existing] = await tx.select().from(topics).where(and(
          eq(topics.subjectId, subjectId),
          parentTopicId ? eq(topics.parentTopicId, parentTopicId) : isNull(topics.parentTopicId),
          sql`lower(${topics.name}) = ${topicName.toLocaleLowerCase()}`,
        )).limit(1);
        if (existing) {
          topicCache.set(key, existing);
          return existing;
        }

        const [created] = await tx.insert(topics).values({
          subjectId,
          parentTopicId,
          name: topicName,
          description: "",
          displayOrder: 0,
          isActive: true,
          createdBy: actorId,
          updatedBy: actorId,
        }).returning();
        if (parentTopicId) summary.subtopicsCreated += 1;
        else summary.topicsCreated += 1;
        topicCache.set(key, created);
        return created;
      };

      for (const row of rows) {
        const exam = await resolveExam(row);
        const subject = await resolveSubject(row, exam.id);
        const topic = await resolveTopic(row, subject.id, null, row.topicName);
        const subtopic = row.subtopicName ? await resolveTopic(row, subject.id, topic.id, row.subtopicName) : null;

        const duplicateFilter = [
          eq(questions.examId, exam.id),
          eq(questions.subjectId, subject.id),
          eq(questions.topicId, topic.id),
          subtopic ? eq(questions.subtopicId, subtopic.id) : isNull(questions.subtopicId),
          sql`lower(${questions.prompt}) = ${row.question.prompt.toLocaleLowerCase()}`,
        ];
        const [duplicate] = await tx.select({ id: questions.id }).from(questions).where(and(...duplicateFilter)).limit(1);
        if (duplicate) throw rowError(row.rowNumber, "This question already exists in the selected topic/subtopic.");

        const [question] = await tx.insert(questions).values({
          examId: exam.id,
          subjectId: subject.id,
          topicId: topic.id,
          subtopicId: subtopic?.id ?? null,
          type: row.question.type,
          prompt: row.question.prompt,
          explanation: row.question.explanation,
          difficulty: row.question.difficulty,
          source: row.question.source,
          reference: row.question.reference,
          tags: row.question.tags,
          estimatedTimeSeconds: row.question.estimatedTimeSeconds,
          isActive: row.question.isActive,
          archivedAt: null,
          createdBy: actorId,
          updatedBy: actorId,
        }).returning({ id: questions.id });
        await tx.insert(questionOptions).values(row.question.options.map((option) => ({ ...option, questionId: question.id })));
        summary.questionsImported += 1;
      }

      return summary;
    });
  },
};
