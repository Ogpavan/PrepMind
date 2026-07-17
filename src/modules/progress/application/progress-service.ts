import { progressRepository } from "../infrastructure/progress-repository";
import { progressFilterSchema, type ProgressFilters } from "../schemas/progress-schema";
import { ApplicationError } from "@/shared/errors/application-error";
import { calculateAccuracy } from "../domain/calculation";

function withAccuracy<T extends { attempted: number; correct: number }>(rows: T[]) { return rows.map((row) => ({ ...row, accuracy: calculateAccuracy(row.correct, row.attempted) })); }
export const progressService = {
  async get(userId: string, rawFilters: ProgressFilters = {}) { const parsed = progressFilterSchema.safeParse(rawFilters); if (!parsed.success) throw new ApplicationError("VALIDATION", "Invalid progress filters."); const filters = parsed.data; const [metrics, subjects, topics, daily] = await Promise.all([progressRepository.metrics(userId, filters), progressRepository.subjectPerformance(userId, filters), progressRepository.topicPerformance(userId, filters), progressRepository.dailyActivity(userId, filters)]); return { metrics: { ...metrics, accuracy: calculateAccuracy(metrics.correct, metrics.attempted) }, subjects: withAccuracy(subjects), topics: withAccuracy(topics), daily }; },
  subjectOverview: (userId: string, examId?: string) => progressRepository.subjectOverview(userId, examId), availableQuestions: (examId?: string) => progressRepository.availableQuestions(examId),
};
