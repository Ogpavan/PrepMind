import { z } from "zod";
import { env } from "@/config/env";
import { ApplicationError } from "@/shared/errors/application-error";
import { generationRepository, type GeneratedQuestion } from "../infrastructure/generation-repository";

const requestSchema = z.object({
  topicId: z.uuid(),
  totalQuestions: z.coerce.number().int().min(10).max(200).refine((value) => value % 10 === 0, "Generate in batches of 10."),
});

const generatedQuestionSchema = z.object({
  questionNumber: z.number().int().min(1).max(10),
  question: z.string().trim().min(10).max(2000),
  options: z.object({
    A: z.string().trim().min(1).max(1000),
    B: z.string().trim().min(1).max(1000),
    C: z.string().trim().min(1).max(1000),
    D: z.string().trim().min(1).max(1000),
  }),
  correctOption: z.enum(["A", "B", "C", "D"]),
  explanation: z.string().trim().max(180),
  topic: z.string().trim().min(1).max(180),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

const responseSchema = z.object({ questions: z.array(generatedQuestionSchema).length(10) });
const groqResponseSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1),
});

class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfterMs: number,
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

function buildPrompt(context: { examName: string; subjectName: string; topicName: string }, existingPrompts: string[]) {
  const avoid = existingPrompts.slice(-60).map((prompt, index) => `${index + 1}. ${prompt}`).join("\n");
  return `You are an expert question setter for the ${context.examName} examination. Generate exactly 10 unique multiple-choice questions in English. Question numbers must be from 1 to 10. Subject: ${context.subjectName}. Topic: ${context.topicName}. Every question must have exactly four options A, B, C and D, exactly one correct answer, a short explanation of maximum 20 words, topic and difficulty. Avoid repeated, vague or doubtful questions. Do not repeat any of these existing questions:\n${avoid || "None"}\nReturn only valid JSON using this structure: {"questions":[{"questionNumber":1,"question":"Question text","options":{"A":"Option A","B":"Option B","C":"Option C","D":"Option D"},"correctOption":"A","explanation":"Short explanation","topic":"${context.topicName}","difficulty":"easy"}]}`;
}

function parseRetryAfter(response: Response, body: string) {
  const header = response.headers.get("retry-after");
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000;
    const date = Date.parse(header);
    if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  }

  const minuteMatch = body.match(/try again in\s+(\d+(?:\.\d+)?)m(\d+(?:\.\d+)?)s/i);
  if (minuteMatch) return (Number(minuteMatch[1]) * 60 + Number(minuteMatch[2])) * 1000;
  const secondMatch = body.match(/try again in\s+(\d+(?:\.\d+)?)s/i);
  if (secondMatch) return Number(secondMatch[1]) * 1000;
  return 30_000;
}

async function requestGroq(prompt: string): Promise<GeneratedQuestion[]> {
  if (!env.GROQ_API_KEY) throw new ApplicationError("VALIDATION", "GROQ_API_KEY is not configured.");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      reasoning_effort: "low",
      include_reasoning: false,
      response_format: { type: "json_object" },
      max_completion_tokens: 2500,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 429) throw new RateLimitError(`Groq rate limit hit: ${text.slice(0, 180)}`, parseRetryAfter(response, text));
    throw new ApplicationError("CONFLICT", `Groq request failed (${response.status}): ${text.slice(0, 240)}`);
  }

  const payload = groqResponseSchema.safeParse(await response.json());
  if (!payload.success) throw new ApplicationError("CONFLICT", "Groq returned an unexpected response shape.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(payload.data.choices[0].message.content);
  } catch {
    throw new ApplicationError("CONFLICT", "Groq returned invalid JSON content.");
  }

  const result = responseSchema.safeParse(parsed);
  if (!result.success) throw new ApplicationError("CONFLICT", "Groq generated questions did not match the required format.");
  return result.data.questions.map((item) => ({
    question: item.question,
    options: item.options,
    correctOption: item.correctOption,
    explanation: item.explanation,
    topic: item.topic,
    difficulty: item.difficulty,
  }));
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestGroqWithRetry(prompt: string, logId: string): Promise<GeneratedQuestion[]> {
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      return await requestGroq(prompt);
    } catch (error) {
      if (!(error instanceof RateLimitError) || attempt === 8) throw error;
      const waitMs = Math.min(Math.max(error.retryAfterMs, 5_000), 90_000);
      await generationRepository.appendLog(logId, `Rate limit hit. Waiting ${Math.ceil(waitMs / 1000)} seconds before retry ${attempt + 1}.`);
      await wait(waitMs);
    }
  }
  throw new ApplicationError("CONFLICT", "Groq rate limit retries were exhausted.");
}

async function runGeneration(input: z.output<typeof requestSchema>, actorId: string, log: { id: string }, context: NonNullable<Awaited<ReturnType<typeof generationRepository.findTopicContext>>>) {
  let generatedQuestions = 0;
  let insertedQuestions = 0;
  let failedQuestions = 0;
  let attempts = 0;
  const maxAttempts = input.totalQuestions / 10 + 5;

  try {
    while (insertedQuestions < input.totalQuestions && attempts < maxAttempts) {
      attempts += 1;
      const existing = await generationRepository.existingPrompts(context);
      const batch = await requestGroqWithRetry(buildPrompt(context, [...existing]), log.id);
      generatedQuestions += batch.length;
      const insertResult = await generationRepository.insertQuestions(context, batch, actorId);
      insertedQuestions += insertResult.inserted;
      failedQuestions += insertResult.skipped;
      await generationRepository.appendLog(
        log.id,
        `Batch ${attempts}: generated ${batch.length}, inserted ${insertResult.inserted}, skipped ${insertResult.skipped}. Total inserted: ${insertedQuestions}/${input.totalQuestions}.`,
        { generatedQuestions, insertedQuestions, failedQuestions },
      );
      if (insertedQuestions < input.totalQuestions) await wait(1800);
    }

    const completed = insertedQuestions >= input.totalQuestions;
    await generationRepository.appendLog(log.id, completed ? "Generation completed." : "Generation stopped before target because too many duplicates were returned.", {
      status: completed ? "completed" : "failed",
      generatedQuestions,
      insertedQuestions,
      failedQuestions,
      completedAt: new Date(),
    });
    return { logId: log.id, insertedQuestions, generatedQuestions, failedQuestions };
  } catch (error) {
    await generationRepository.appendLog(log.id, error instanceof Error ? error.message : "Generation failed.", {
      status: "failed",
      generatedQuestions,
      insertedQuestions,
      failedQuestions,
      completedAt: new Date(),
    });
    throw error;
  }
}

export const generationService = {
  listLogs: () => generationRepository.listLogs(),
  async startForTopic(raw: unknown, actorId: string) {
    const parsed = requestSchema.safeParse(raw);
    if (!parsed.success) throw new ApplicationError("VALIDATION", "Choose a topic and a question count in batches of 10.");

    const context = await generationRepository.findTopicContext(parsed.data.topicId);
    if (!context) throw new ApplicationError("NOT_FOUND", "Topic not found.");

    const log = await generationRepository.createLog({
      examId: context.examId,
      subjectId: context.subjectId,
      topicId: context.topicId,
      model: env.GROQ_MODEL,
      status: "running",
      requestedQuestions: parsed.data.totalQuestions,
      generatedQuestions: 0,
      insertedQuestions: 0,
      failedQuestions: 0,
      message: `Generating ${parsed.data.totalQuestions} questions for ${context.topicName}.`,
      details: [{ at: new Date().toISOString(), message: `Started ${context.subjectName} / ${context.topicName}.` }],
      createdBy: actorId,
      startedAt: new Date(),
    });

    void runGeneration(parsed.data, actorId, log, context).catch((error) => {
      console.error("Background question generation failed", error);
    });
    return { logId: log.id };
  },
  async generateForTopic(raw: unknown, actorId: string) {
    const parsed = requestSchema.safeParse(raw);
    if (!parsed.success) throw new ApplicationError("VALIDATION", "Choose a topic and a question count in batches of 10.");

    const context = await generationRepository.findTopicContext(parsed.data.topicId);
    if (!context) throw new ApplicationError("NOT_FOUND", "Topic not found.");

    const log = await generationRepository.createLog({
      examId: context.examId,
      subjectId: context.subjectId,
      topicId: context.topicId,
      model: env.GROQ_MODEL,
      status: "running",
      requestedQuestions: parsed.data.totalQuestions,
      generatedQuestions: 0,
      insertedQuestions: 0,
      failedQuestions: 0,
      message: `Generating ${parsed.data.totalQuestions} questions for ${context.topicName}.`,
      details: [{ at: new Date().toISOString(), message: `Started ${context.subjectName} / ${context.topicName}.` }],
      createdBy: actorId,
      startedAt: new Date(),
    });
    return runGeneration(parsed.data, actorId, log, context);
  },
};
