import { count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/infrastructure/database/client";
import { attempts, exams, questions, subjects, topics, users } from "@/infrastructure/database/schema";

export const adminDashboardRepository = {
  async get() { const today = new Date(); today.setUTCHours(0, 0, 0, 0); const [[questionStats], [examStats], [subjectStats], [topicStats], [studentStats], [todayStats], recentQuestions, recentActivity] = await Promise.all([
    db.select({ total: count(), active: sql<number>`count(*) filter (where ${questions.isActive} = true and ${questions.archivedAt} is null)::int` }).from(questions),
    db.select({ total: count() }).from(exams), db.select({ total: count() }).from(subjects), db.select({ total: count() }).from(topics), db.select({ total: count() }).from(users).where(eq(users.role, "STUDENT")),
    db.select({ attempted: sql<number>`count(*) filter (where ${attempts.isSkipped} = false)::int`, accuracy: sql<number>`coalesce(100.0 * count(*) filter (where ${attempts.isCorrect} = true) / nullif(count(*) filter (where ${attempts.isSkipped} = false), 0), 0)::float` }).from(attempts).where(gte(attempts.answeredAt, today)),
    db.select({ id: questions.id, prompt: questions.prompt, difficulty: questions.difficulty, createdAt: questions.createdAt, subjectName: subjects.name }).from(questions).innerJoin(subjects, eq(questions.subjectId, subjects.id)).orderBy(desc(questions.createdAt)).limit(6),
    db.select({ id: attempts.id, learnerName: users.name, prompt: questions.prompt, isCorrect: attempts.isCorrect, isSkipped: attempts.isSkipped, answeredAt: attempts.answeredAt }).from(attempts).innerJoin(users, eq(attempts.userId, users.id)).innerJoin(questions, eq(attempts.questionId, questions.id)).orderBy(desc(attempts.answeredAt)).limit(6),
  ]); return { totalQuestions: questionStats.total, activeQuestions: questionStats.active, totalExams: examStats.total, totalSubjects: subjectStats.total, totalTopics: topicStats.total, totalStudents: studentStats.total, attemptedToday: todayStats.attempted, averageAccuracy: todayStats.accuracy, recentQuestions, recentActivity }; },
};
