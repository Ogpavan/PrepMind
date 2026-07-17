import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/infrastructure/database/client";
import { attempts, exams, questionOptions, questions, studySessionQuestions, studySessions, subjects, topics, type QuestionSnapshot } from "@/infrastructure/database/schema";
import { calculateCorrectness } from "@/modules/questions/domain/correctness";
import type { CompleteSessionInput, CreateSessionInput } from "../schemas/study-schema";

export const studyRepository = {
  async create(userId: string, input: CreateSessionInput) {
    return db.transaction(async (tx) => {
      const filters = [eq(questions.examId, input.examId), eq(questions.isActive, true), isNull(questions.archivedAt), input.subjectId ? eq(questions.subjectId, input.subjectId) : undefined, input.topicId ? eq(questions.topicId, input.topicId) : undefined, input.difficulty ? eq(questions.difficulty, input.difficulty) : undefined].filter(Boolean) as ReturnType<typeof eq>[];
      const selected = await tx.select({ id: questions.id, prompt: questions.prompt, type: questions.type, explanation: questions.explanation, difficulty: questions.difficulty, subjectName: subjects.name, topicName: topics.name }).from(questions).innerJoin(subjects, eq(questions.subjectId, subjects.id)).innerJoin(topics, eq(questions.topicId, topics.id)).where(and(...filters)).orderBy(sql`random()`).limit(input.questionCount);
      if (selected.length < input.questionCount) return { available: selected.length, session: null };
      const ids = selected.map((item) => item.id); const options = await tx.select().from(questionOptions).where(inArray(questionOptions.questionId, ids)).orderBy(asc(questionOptions.displayOrder)); const optionsByQuestion = new Map<string, typeof options>(); for (const option of options) optionsByQuestion.set(option.questionId, [...(optionsByQuestion.get(option.questionId) ?? []), option]);
      const [session] = await tx.insert(studySessions).values({ userId, examId: input.examId, subjectId: input.subjectId, topicId: input.topicId, difficulty: input.difficulty, status: "in_progress", isTimed: input.isTimed, durationSeconds: input.isTimed ? (input.durationMinutes ?? 1) * 60 : null, startedAt: new Date() }).returning();
      await tx.insert(studySessionQuestions).values(selected.map((item, index) => ({ sessionId: session.id, questionId: item.id, questionOrder: index + 1, snapshot: { prompt: item.prompt, type: item.type, explanation: item.explanation, difficulty: item.difficulty, subjectName: item.subjectName, topicName: item.topicName, options: (optionsByQuestion.get(item.id) ?? []).map((option) => ({ id: option.id, text: option.text, displayOrder: option.displayOrder, isCorrect: option.isCorrect })) } satisfies QuestionSnapshot })));
      return { available: selected.length, session };
    });
  },
  async getOwnedSession(sessionId: string, userId: string) { const [session] = await db.select({ session: studySessions, examName: exams.name }).from(studySessions).innerJoin(exams, eq(studySessions.examId, exams.id)).where(and(eq(studySessions.id, sessionId), eq(studySessions.userId, userId))).limit(1); if (!session) return null; const [sessionQuestions, sessionAttempts] = await Promise.all([db.select().from(studySessionQuestions).where(eq(studySessionQuestions.sessionId, sessionId)).orderBy(asc(studySessionQuestions.questionOrder)), db.select().from(attempts).where(and(eq(attempts.sessionId, sessionId), eq(attempts.userId, userId)))]); return { ...session, questions: sessionQuestions, attempts: sessionAttempts }; },
  async completeWithAnswers(userId: string, input: CompleteSessionInput) {
    return db.transaction(async (tx) => {
      const [session] = await tx.select().from(studySessions).where(and(eq(studySessions.id, input.sessionId), eq(studySessions.userId, userId))).for("update").limit(1);
      if (!session) return { kind: "not_found" as const };
      if (session.status === "completed") return { kind: "already_completed" as const, session };
      if (session.status !== "in_progress") return { kind: "invalid_status" as const };

      const [questionRows, existingAttempts] = await Promise.all([
        tx.select().from(studySessionQuestions).where(eq(studySessionQuestions.sessionId, session.id)),
        tx.select().from(attempts).where(eq(attempts.sessionId, session.id)),
      ]);
      const questionsById = new Map(questionRows.map((question) => [question.id, question]));
      const existingIds = new Set(existingAttempts.map((attempt) => attempt.sessionQuestionId));
      const newAttempts: Array<typeof attempts.$inferInsert> = [];

      for (const answer of input.answers) {
        if (existingIds.has(answer.sessionQuestionId)) continue;
        const question = questionsById.get(answer.sessionQuestionId);
        if (!question) return { kind: "invalid_question" as const };
        const validIds = new Set(question.snapshot.options.map((option) => option.id));
        const selected = [...new Set(answer.selectedOptionIds)];
        if (selected.some((id) => !validIds.has(id))) return { kind: "invalid_options" as const };
        const skipped = answer.skip || selected.length === 0;
        const correctIds = question.snapshot.options.filter((option) => option.isCorrect).map((option) => option.id);
        newAttempts.push({
          sessionId: session.id,
          sessionQuestionId: question.id,
          userId,
          questionId: question.questionId,
          selectedOptionIds: skipped ? [] : selected,
          isCorrect: skipped ? null : calculateCorrectness(selected, correctIds),
          isSkipped: skipped,
          responseTimeSeconds: answer.responseTimeSeconds,
        });
      }

      if (newAttempts.length) await tx.insert(attempts).values(newAttempts);
      const attemptedIds = new Set([...existingIds, ...newAttempts.map((attempt) => attempt.sessionQuestionId)]);
      const missing = questionRows.filter((question) => !attemptedIds.has(question.id));
      if (!input.timedOut && missing.length) return { kind: "incomplete" as const, remaining: missing.length };
      if (input.timedOut && missing.length) await tx.insert(attempts).values(missing.map((question) => ({ sessionId: session.id, sessionQuestionId: question.id, userId, questionId: question.questionId, selectedOptionIds: [], isCorrect: null, isSkipped: true, responseTimeSeconds: 0 })));

      const [completed] = await tx.update(studySessions).set({ status: "completed", completedAt: new Date(), updatedAt: new Date() }).where(eq(studySessions.id, session.id)).returning();
      return { kind: "completed" as const, session: completed };
    });
  },
  async complete(sessionId: string, userId: string, fillSkipped = false) { return db.transaction(async (tx) => { const [session] = await tx.select().from(studySessions).where(and(eq(studySessions.id, sessionId), eq(studySessions.userId, userId))).for("update").limit(1); if (!session) return { kind: "not_found" as const }; if (session.status === "completed") return { kind: "already_completed" as const, session }; if (session.status !== "in_progress") return { kind: "invalid_status" as const }; const questionRows = await tx.select().from(studySessionQuestions).where(eq(studySessionQuestions.sessionId, sessionId)); const attemptRows = await tx.select().from(attempts).where(eq(attempts.sessionId, sessionId)); if (fillSkipped) { const attempted = new Set(attemptRows.map((item) => item.sessionQuestionId)); const missing = questionRows.filter((item) => !attempted.has(item.id)); if (missing.length) await tx.insert(attempts).values(missing.map((item) => ({ sessionId, sessionQuestionId: item.id, userId, questionId: item.questionId, selectedOptionIds: [], isCorrect: null, isSkipped: true, responseTimeSeconds: 0 }))); } else if (attemptRows.length < questionRows.length) return { kind: "incomplete" as const, remaining: questionRows.length - attemptRows.length }; const [completed] = await tx.update(studySessions).set({ status: "completed", completedAt: new Date(), updatedAt: new Date() }).where(eq(studySessions.id, sessionId)).returning(); return { kind: "completed" as const, session: completed }; }); },
  async abandon(sessionId: string, userId: string) { const [session] = await db.update(studySessions).set({ status: "abandoned", abandonedAt: new Date(), updatedAt: new Date() }).where(and(eq(studySessions.id, sessionId), eq(studySessions.userId, userId), eq(studySessions.status, "in_progress"))).returning(); return session ?? null; },
  async recent(userId: string, limit = 6) { return db.select({ id: studySessions.id, status: studySessions.status, createdAt: studySessions.createdAt, completedAt: studySessions.completedAt, examName: exams.name, totalQuestions: sql<number>`(select count(*)::int from ${studySessionQuestions} sq where sq.session_id = ${studySessions.id})`, attempted: sql<number>`(select count(*)::int from ${attempts} a where a.session_id = ${studySessions.id})` }).from(studySessions).innerJoin(exams, eq(studySessions.examId, exams.id)).where(eq(studySessions.userId, userId)).orderBy(sql`${studySessions.createdAt} desc`).limit(limit); },
};
