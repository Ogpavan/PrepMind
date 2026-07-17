import { ApplicationError } from "@/shared/errors/application-error";
import { attemptRepository } from "../infrastructure/attempt-repository";

type Performance = { label: string; attempted: number; correct: number; accuracy: number };

function groupPerformance<T>(rows: T[], label: (row: T) => string, correct: (row: T) => boolean | null) {
  const map = new Map<string, { attempted: number; correct: number }>();
  for (const row of rows) {
    const key = label(row);
    const current = map.get(key) ?? { attempted: 0, correct: 0 };
    current.attempted += 1;
    if (correct(row)) current.correct += 1;
    map.set(key, current);
  }
  return [...map.entries()].map(([label, value]) => ({
    label,
    ...value,
    accuracy: value.attempted ? value.correct / value.attempted * 100 : 0,
  } satisfies Performance));
}

export const summaryService = {
  async get(sessionId: string, userId: string) {
    const result = await attemptRepository.getSessionResults(sessionId, userId);
    if (!result) throw new ApplicationError("NOT_FOUND", "Session summary not found.");
    if (result.session.status !== "completed") throw new ApplicationError("CONFLICT", "Complete the session before viewing its summary.");

    const rows = result.rows;
    const attemptedRows = rows.filter((row) => !row.attempt.isSkipped);
    const correct = attemptedRows.filter((row) => row.attempt.isCorrect).length;
    const incorrect = attemptedRows.length - correct;
    const skipped = rows.filter((row) => row.attempt.isSkipped).length;
    const totalTime = rows.reduce((sum, row) => sum + row.attempt.responseTimeSeconds, 0);

    return {
      session: result.session,
      total: rows.length,
      attempted: attemptedRows.length,
      correct,
      incorrect,
      skipped,
      accuracy: attemptedRows.length ? correct / attemptedRows.length * 100 : 0,
      totalTime,
      averageTime: rows.length ? totalTime / rows.length : 0,
      subjectPerformance: groupPerformance(attemptedRows, (row) => row.sessionQuestion.snapshot.subjectName, (row) => row.attempt.isCorrect),
      topicPerformance: groupPerformance(attemptedRows, (row) => row.sessionQuestion.snapshot.topicName, (row) => row.attempt.isCorrect),
      difficultyPerformance: groupPerformance(attemptedRows, (row) => row.sessionQuestion.snapshot.difficulty, (row) => row.attempt.isCorrect),
      review: rows.map((row) => ({
        order: row.sessionQuestion.questionOrder,
        prompt: row.sessionQuestion.snapshot.prompt,
        options: row.sessionQuestion.snapshot.options,
        selectedOptionIds: row.attempt.selectedOptionIds,
        isCorrect: row.attempt.isCorrect,
        isSkipped: row.attempt.isSkipped,
        explanation: row.sessionQuestion.snapshot.explanation,
      })),
    };
  },
};

export type SessionSummaryData = Awaited<ReturnType<typeof summaryService.get>>;
