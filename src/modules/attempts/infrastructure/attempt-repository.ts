import { and, asc, eq } from "drizzle-orm";
import { db } from "@/infrastructure/database/client";
import { attempts, exams, studySessionQuestions, studySessions } from "@/infrastructure/database/schema";

export const attemptRepository = {
  async getSessionResults(sessionId: string, userId: string) { const [session] = await db.select({ id: studySessions.id, status: studySessions.status, startedAt: studySessions.startedAt, completedAt: studySessions.completedAt, examName: exams.name }).from(studySessions).innerJoin(exams, eq(studySessions.examId, exams.id)).where(and(eq(studySessions.id, sessionId), eq(studySessions.userId, userId))).limit(1); if (!session) return null; const rows = await db.select({ sessionQuestion: studySessionQuestions, attempt: attempts }).from(studySessionQuestions).innerJoin(attempts, eq(attempts.sessionQuestionId, studySessionQuestions.id)).where(eq(studySessionQuestions.sessionId, sessionId)).orderBy(asc(studySessionQuestions.questionOrder)); return { session, rows }; },
};
