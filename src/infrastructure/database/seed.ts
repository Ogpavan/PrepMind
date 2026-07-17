import "dotenv/config";
import { hash } from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { exams, questionOptions, questions, subjects, topics, users } from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

const sampleQuestions = [
  { prompt: "What is 25% of 240?", answer: "60", distractors: ["40", "50", "80"], difficulty: "easy" as const, explanation: "25% is one quarter, and 240 ÷ 4 = 60." },
  { prompt: "If x + 7 = 19, what is x?", answer: "12", distractors: ["10", "11", "26"], difficulty: "easy" as const, explanation: "Subtract 7 from both sides: x = 19 − 7 = 12." },
  { prompt: "A number increases from 80 to 100. What is the percentage increase?", answer: "25%", distractors: ["20%", "22.5%", "80%"], difficulty: "medium" as const, explanation: "The increase is 20; 20 ÷ 80 × 100 = 25%." },
  { prompt: "Solve 3x − 5 = 16.", answer: "7", distractors: ["5", "6", "21"], difficulty: "medium" as const, explanation: "Add 5, giving 3x = 21, then divide by 3." },
  { prompt: "What is the simple interest on ₹2,000 at 5% per annum for 3 years?", answer: "₹300", distractors: ["₹100", "₹150", "₹600"], difficulty: "medium" as const, explanation: "SI = P × R × T / 100 = 2000 × 5 × 3 / 100 = 300." },
  { prompt: "The ratio 18:24 in its simplest form is:", answer: "3:4", distractors: ["2:3", "4:5", "6:8"], difficulty: "easy" as const, explanation: "Divide both terms by their greatest common divisor, 6." },
  { prompt: "Which word is closest in meaning to ‘meticulous’?", answer: "Careful", distractors: ["Careless", "Rapid", "Ordinary"], difficulty: "medium" as const, explanation: "Meticulous describes someone very careful and precise." },
  { prompt: "Choose the grammatically correct sentence.", answer: "Neither of the answers is correct.", distractors: ["Neither of the answers are correct.", "Neither answers is correct.", "Neither of answer are correct."], difficulty: "medium" as const, explanation: "In formal usage, ‘neither’ is singular and takes ‘is’." },
  { prompt: "The opposite of ‘scarce’ is:", answer: "Abundant", distractors: ["Rare", "Limited", "Small"], difficulty: "easy" as const, explanation: "Scarce means insufficient; abundant means plentiful." },
  { prompt: "Which sentence uses ‘affect’ correctly?", answer: "The weather can affect your mood.", distractors: ["The weather had a positive affect.", "Her affect was to smile.", "It will effect how we feel."], difficulty: "hard" as const, explanation: "‘Affect’ is normally the verb meaning to influence." },
  { prompt: "All prime numbers greater than 2 are odd.", answer: "True", distractors: ["False"], difficulty: "easy" as const, explanation: "Any even number greater than 2 is divisible by 2 and therefore not prime.", type: "true_false" as const },
  { prompt: "Select all numbers divisible by 3.", answer: "3", distractors: ["6", "8", "11"], difficulty: "easy" as const, explanation: "3 and 6 are divisible by 3.", type: "multiple_choice" as const, additionalCorrect: ["6"] },
];

async function main() {
  try {
    await db.transaction(async (tx) => {
    const adminHash = await hash("Admin@12345", 12);
    const studentHash = await hash("Student@12345", 12);
    await tx.insert(users).values([
      { name: "PrepMind Administrator", email: "admin@prepmind.local", passwordHash: adminHash, role: "SUPER_ADMIN" },
      { name: "Demo Learner", email: "student@prepmind.local", passwordHash: studentHash, role: "STUDENT" },
    ]).onConflictDoNothing();

    const [admin] = await tx.select().from(users).where(eq(users.email, "admin@prepmind.local")).limit(1);
    if (!admin) throw new Error("Admin seed failed");

    await tx.insert(exams).values({ name: "General Aptitude", code: "GAT", description: "A balanced preparation set covering quantitative and verbal aptitude.", totalMarks: 100, targetScore: 70, durationMinutes: 90, createdBy: admin.id, updatedBy: admin.id }).onConflictDoNothing();
    const [exam] = await tx.select().from(exams).where(eq(exams.code, "GAT")).limit(1);
    if (!exam) throw new Error("Exam seed failed");

    await tx.insert(subjects).values([
      { examId: exam.id, name: "Quantitative Aptitude", code: "QUANT", description: "Arithmetic and algebra fundamentals", displayOrder: 1, createdBy: admin.id, updatedBy: admin.id },
      { examId: exam.id, name: "Verbal Ability", code: "VERBAL", description: "Vocabulary, grammar, and usage", displayOrder: 2, createdBy: admin.id, updatedBy: admin.id },
    ]).onConflictDoNothing();
    const allSubjects = await tx.select().from(subjects).where(eq(subjects.examId, exam.id));
    const quant = allSubjects.find((item) => item.code === "QUANT");
    const verbal = allSubjects.find((item) => item.code === "VERBAL");
    if (!quant || !verbal) throw new Error("Subject seed failed");

    await tx.insert(topics).values([
      { subjectId: quant.id, name: "Arithmetic", description: "Percentages, ratios, interest, and number properties", displayOrder: 1, createdBy: admin.id, updatedBy: admin.id },
      { subjectId: quant.id, name: "Algebra", description: "Equations and expressions", displayOrder: 2, createdBy: admin.id, updatedBy: admin.id },
      { subjectId: verbal.id, name: "Vocabulary", description: "Synonyms and antonyms", displayOrder: 1, createdBy: admin.id, updatedBy: admin.id },
      { subjectId: verbal.id, name: "Grammar", description: "Usage and sentence correction", displayOrder: 2, createdBy: admin.id, updatedBy: admin.id },
    ]).onConflictDoNothing();
    const allTopics = await tx.select().from(topics).where(sql`${topics.subjectId} IN (${quant.id}, ${verbal.id})`);
    const topicByName = new Map(allTopics.map((item) => [item.name, item]));

    const [{ count }] = await tx.select({ count: sql<number>`count(*)::int` }).from(questions).where(eq(questions.examId, exam.id));
    if (count === 0) {
      for (let index = 0; index < sampleQuestions.length; index += 1) {
        const item = sampleQuestions[index];
        const isVerbal = index >= 6 && index <= 9;
        const subject = isVerbal ? verbal : quant;
        const topic = topicByName.get(isVerbal ? (index === 6 || index === 8 ? "Vocabulary" : "Grammar") : (index === 1 || index === 3 ? "Algebra" : "Arithmetic"));
        if (!topic) throw new Error("Topic seed failed");
        const [question] = await tx.insert(questions).values({ examId: exam.id, subjectId: subject.id, topicId: topic.id, type: item.type ?? "single_choice", prompt: item.prompt, explanation: item.explanation, difficulty: item.difficulty, source: "PrepMind sample bank", tags: ["sample"], estimatedTimeSeconds: 60, createdBy: admin.id, updatedBy: admin.id }).returning();
        const correctValues = new Set([item.answer, ...(item.additionalCorrect ?? [])]);
        const values = [item.answer, ...item.distractors];
        await tx.insert(questionOptions).values(values.map((text, displayOrder) => ({ questionId: question.id, text, displayOrder, isCorrect: correctValues.has(text) })));
      }
    }
    });
    console.info("Seed complete. Admin: admin@prepmind.local / Admin@12345; Student: student@prepmind.local / Student@12345");
  } finally {
    await client.end();
  }
}

void main();
