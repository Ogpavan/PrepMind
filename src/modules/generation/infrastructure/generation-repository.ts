import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/infrastructure/database/client";
import { exams, generationLogs, questionOptions, questions, subjects, topics, users } from "@/infrastructure/database/schema";

export type TopicGenerationContext = {
  examId: string;
  examName: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  questionTopicId: string;
  subtopicId: string | null;
};

export type GeneratedQuestion = {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
};

export type GenerationLogListItem = typeof generationLogs.$inferSelect & {
  examName: string | null;
  subjectName: string | null;
  topicName: string | null;
  actorName: string | null;
};

export const generationRepository = {
  async findTopicContext(topicId: string): Promise<TopicGenerationContext | null> {
    const [row] = await db
      .select({
        examId: exams.id,
        examName: exams.name,
        subjectId: subjects.id,
        subjectName: subjects.name,
        topicId: topics.id,
        topicName: topics.name,
        parentTopicId: topics.parentTopicId,
      })
      .from(topics)
      .innerJoin(subjects, eq(topics.subjectId, subjects.id))
      .innerJoin(exams, eq(subjects.examId, exams.id))
      .where(eq(topics.id, topicId))
      .limit(1);
    if (!row) return null;
    return {
      examId: row.examId,
      examName: row.examName,
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      topicId: row.topicId,
      topicName: row.topicName,
      questionTopicId: row.parentTopicId ?? row.topicId,
      subtopicId: row.parentTopicId ? row.topicId : null,
    };
  },
  async listLogs(limit = 100): Promise<GenerationLogListItem[]> {
    return db
      .select({
        id: generationLogs.id,
        examId: generationLogs.examId,
        subjectId: generationLogs.subjectId,
        topicId: generationLogs.topicId,
        model: generationLogs.model,
        status: generationLogs.status,
        requestedQuestions: generationLogs.requestedQuestions,
        generatedQuestions: generationLogs.generatedQuestions,
        insertedQuestions: generationLogs.insertedQuestions,
        failedQuestions: generationLogs.failedQuestions,
        message: generationLogs.message,
        details: generationLogs.details,
        createdBy: generationLogs.createdBy,
        startedAt: generationLogs.startedAt,
        completedAt: generationLogs.completedAt,
        createdAt: generationLogs.createdAt,
        updatedAt: generationLogs.updatedAt,
        examName: exams.name,
        subjectName: subjects.name,
        topicName: topics.name,
        actorName: users.name,
      })
      .from(generationLogs)
      .leftJoin(exams, eq(generationLogs.examId, exams.id))
      .leftJoin(subjects, eq(generationLogs.subjectId, subjects.id))
      .leftJoin(topics, eq(generationLogs.topicId, topics.id))
      .leftJoin(users, eq(generationLogs.createdBy, users.id))
      .orderBy(desc(generationLogs.createdAt))
      .limit(limit);
  },
  async createLog(values: typeof generationLogs.$inferInsert) {
    const [log] = await db.insert(generationLogs).values(values).returning();
    return log;
  },
  async appendLog(id: string, message: string, values: Partial<typeof generationLogs.$inferInsert> = {}) {
    const entry = { at: new Date().toISOString(), message };
    const [log] = await db
      .update(generationLogs)
      .set({
        ...values,
        message,
        updatedAt: new Date(),
        details: sql`${generationLogs.details} || ${JSON.stringify([entry])}::jsonb`,
      })
      .where(eq(generationLogs.id, id))
      .returning();
    return log;
  },
  async existingPrompts(context: TopicGenerationContext) {
    const rows = await db
      .select({ prompt: questions.prompt })
      .from(questions)
      .where(and(
        eq(questions.examId, context.examId),
        eq(questions.subjectId, context.subjectId),
        eq(questions.topicId, context.questionTopicId),
        context.subtopicId ? eq(questions.subtopicId, context.subtopicId) : isNull(questions.subtopicId),
      ));
    return new Set(rows.map((row) => row.prompt.trim().toLocaleLowerCase()));
  },
  async insertQuestions(context: TopicGenerationContext, items: GeneratedQuestion[], actorId: string) {
    return db.transaction(async (tx) => {
      let inserted = 0;
      let skipped = 0;

      for (const item of items) {
        const prompt = item.question.trim();
        const [duplicate] = await tx
          .select({ id: questions.id })
          .from(questions)
          .where(and(
            eq(questions.examId, context.examId),
            eq(questions.subjectId, context.subjectId),
            eq(questions.topicId, context.questionTopicId),
            context.subtopicId ? eq(questions.subtopicId, context.subtopicId) : isNull(questions.subtopicId),
            sql`lower(${questions.prompt}) = ${prompt.toLocaleLowerCase()}`,
          ))
          .limit(1);
        if (duplicate) {
          skipped += 1;
          continue;
        }

        const [question] = await tx.insert(questions).values({
          examId: context.examId,
          subjectId: context.subjectId,
          topicId: context.questionTopicId,
          subtopicId: context.subtopicId,
          type: "single_choice",
          prompt,
          explanation: item.explanation.trim(),
          difficulty: item.difficulty,
          source: "Groq AI",
          reference: "",
          tags: ["ai-generated", context.subjectName, context.topicName],
          estimatedTimeSeconds: 60,
          isActive: true,
          archivedAt: null,
          createdBy: actorId,
          updatedBy: actorId,
        }).returning({ id: questions.id });

        await tx.insert(questionOptions).values((["A", "B", "C", "D"] as const).map((key, displayOrder) => ({
          questionId: question.id,
          text: item.options[key].trim(),
          displayOrder,
          isCorrect: item.correctOption === key,
        })));
        inserted += 1;
      }

      return { inserted, skipped };
    });
  },
};
