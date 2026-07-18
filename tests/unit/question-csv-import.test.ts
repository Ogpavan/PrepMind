import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseQuestionImportCsv, questionImportHeaders } from "@/modules/questions/domain/question-csv-import";

const values: Record<string, string> = {
  exam_code: "SSC_CGL",
  exam_name: "SSC CGL",
  exam_total_marks: "200",
  exam_target_score: "140",
  exam_duration_minutes: "120",
  subject_code: "QUANT",
  subject_name: "Quantitative Aptitude",
  topic_name: "Arithmetic",
  subtopic_name: "Percentages",
  question_type: "single_choice",
  difficulty: "medium",
  question: "What is 20% of 150?",
  option_1: "20",
  option_2: "30",
  option_3: "40",
  option_4: "50",
  correct_options: "2",
  explanation: "20% of 150 is 30.",
  tags: "percentages|arithmetic",
  source: "Test bank",
  reference: "Chapter 1",
  estimated_time_seconds: "60",
  is_active: "true",
};

const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
const validCsv = (overrides: Record<string, string> = {}) => {
  const row = { ...values, ...overrides };
  return `${questionImportHeaders.join(",")}\n${questionImportHeaders.map((header) => csvCell(row[header] ?? "")).join(",")}`;
};

describe("question CSV import", () => {
  it("ships a valid downloadable template", () => {
    const template = readFileSync("public/question-import-template.csv", "utf8");
    const result = parseQuestionImportCsv(template);
    expect(result.success).toBe(true);
    if (result.success) expect(result.rows).toHaveLength(3);
  });

  it("parses a complete question and its hierarchy", () => {
    const result = parseQuestionImportCsv(validCsv({ question: "What is 20%, expressed as a decimal?" }));
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.rows[0]).toMatchObject({
      exam: { code: "SSC_CGL", name: "SSC CGL" },
      subject: { code: "QUANT", name: "Quantitative Aptitude" },
      topicName: "Arithmetic",
      subtopicName: "Percentages",
      question: { prompt: "What is 20%, expressed as a decimal?", tags: ["percentages", "arithmetic"] },
    });
    expect(result.rows[0].question.options[1]).toMatchObject({ text: "30", isCorrect: true });
  });

  it("supports multiple correct answers", () => {
    const result = parseQuestionImportCsv(validCsv({ question_type: "multiple_choice", correct_options: "1|3" }));
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.rows[0].question.options.filter((option) => option.isCorrect)).toHaveLength(2);
  });

  it("reports row-specific correctness errors", () => {
    const result = parseQuestionImportCsv(validCsv({ correct_options: "8" }));
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors["Row 2"].join(" ")).toContain("valid option numbers");
  });

  it("rejects missing required columns", () => {
    const result = parseQuestionImportCsv("exam_code,exam_name\nSSC_CGL,SSC CGL");
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.Header.join(" ")).toContain("Missing required columns");
  });
});
