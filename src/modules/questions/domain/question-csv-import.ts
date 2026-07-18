import { z } from "zod";

export const QUESTION_IMPORT_MAX_BYTES = 4 * 1024 * 1024;
export const QUESTION_IMPORT_MAX_ROWS = 2_000;

export const questionImportHeaders = [
  "exam_code",
  "exam_name",
  "exam_total_marks",
  "exam_target_score",
  "exam_duration_minutes",
  "subject_code",
  "subject_name",
  "topic_name",
  "subtopic_name",
  "question_type",
  "difficulty",
  "question",
  "option_1",
  "option_2",
  "option_3",
  "option_4",
  "correct_options",
  "explanation",
  "tags",
  "source",
  "reference",
  "estimated_time_seconds",
  "is_active",
] as const;

const requiredHeaders = [
  "exam_code",
  "exam_name",
  "exam_total_marks",
  "exam_target_score",
  "exam_duration_minutes",
  "subject_code",
  "subject_name",
  "topic_name",
  "question_type",
  "difficulty",
  "question",
  "option_1",
  "option_2",
  "correct_options",
] as const;

const optionalHeaders = new Set([
  "subtopic_name",
  "explanation",
  "tags",
  "source",
  "reference",
  "estimated_time_seconds",
  "is_active",
]);

const name = (label: string, max: number) => z
  .string()
  .trim()
  .min(2, `${label} must contain at least 2 characters`)
  .max(max, `${label} cannot exceed ${max} characters`)
  .refine((value) => /[\p{L}\p{N}]/u.test(value), `${label} must include a letter or number`)
  .refine((value) => !/[<>\u0000-\u001f\u007f]/u.test(value), `${label} contains unsupported characters`);

const code = (label: string) => z.string().trim().min(2, `${label} is required`).max(40).regex(/^[A-Za-z0-9_-]+$/, `${label} can use letters, numbers, hyphens, and underscores only`);
const requiredInteger = (label: string, minimum: number) => z.string().trim().min(1, `${label} is required`).transform(Number).pipe(z.number().int(`${label} must be a whole number`).min(minimum, `${label} must be at least ${minimum}`));
const optionalText = (max: number) => z.string().trim().max(max);

const csvRowSchema = z.object({
  exam_code: code("Exam code"),
  exam_name: name("Exam name", 180),
  exam_total_marks: requiredInteger("Exam total marks", 1),
  exam_target_score: requiredInteger("Exam target score", 0),
  exam_duration_minutes: requiredInteger("Exam duration", 1),
  subject_code: code("Subject code"),
  subject_name: name("Subject name", 180),
  topic_name: name("Topic name", 180),
  subtopic_name: z.string().trim().max(180).refine((value) => !value || (value.length >= 2 && /[\p{L}\p{N}]/u.test(value) && !/[<>\u0000-\u001f\u007f]/u.test(value)), "Subtopic name is invalid"),
  question_type: z.enum(["single_choice", "multiple_choice", "true_false"], { error: "Question type must be single_choice, multiple_choice, or true_false" }),
  difficulty: z.enum(["easy", "medium", "hard"], { error: "Difficulty must be easy, medium, or hard" }),
  question: z.string().trim().min(5, "Question must contain at least 5 characters").max(20_000).refine((value) => !/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value), "Question contains unsupported characters"),
  correct_options: z.string().trim().min(1, "Correct options are required"),
  explanation: optionalText(20_000),
  tags: optionalText(1_500),
  source: optionalText(240),
  reference: optionalText(500),
  estimated_time_seconds: z.string().trim().transform((value) => value ? Number(value) : 60).pipe(z.number().int("Estimated time must be a whole number").min(1, "Estimated time must be greater than zero").max(3_600)),
  is_active: z.string().trim().toLowerCase().transform((value, context) => {
    if (!value || ["true", "yes", "1"].includes(value)) return true;
    if (["false", "no", "0"].includes(value)) return false;
    context.addIssue({ code: "custom", message: "Active must be true/false, yes/no, or 1/0" });
    return z.NEVER;
  }),
}).refine((value) => value.exam_target_score <= value.exam_total_marks, {
  path: ["exam_target_score"],
  message: "Exam target score cannot exceed total marks",
});

export type QuestionImportRow = {
  rowNumber: number;
  exam: { code: string; name: string; totalMarks: number; targetScore: number; durationMinutes: number };
  subject: { code: string; name: string };
  topicName: string;
  subtopicName: string | null;
  question: {
    type: "single_choice" | "multiple_choice" | "true_false";
    difficulty: "easy" | "medium" | "hard";
    prompt: string;
    options: Array<{ text: string; isCorrect: boolean; displayOrder: number }>;
    explanation: string;
    tags: string[];
    source: string;
    reference: string;
    estimatedTimeSeconds: number;
    isActive: boolean;
  };
};

export type QuestionImportParseResult =
  | { success: true; rows: QuestionImportRow[] }
  | { success: false; errors: Record<string, string[]> };

function parseCsvRecords(csv: string) {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  const input = csv.replace(/^\uFEFF/, "");

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.length === 0) quoted = true;
    else if (character === ",") { record.push(field); field = ""; }
    else if (character === "\n" || character === "\r") {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      record.push(field);
      if (record.some((value) => value.trim())) records.push(record);
      record = [];
      field = "";
    } else field += character;
  }

  if (quoted) throw new Error("The CSV contains an unclosed quoted value");
  record.push(field);
  if (record.some((value) => value.trim())) records.push(record);
  return records;
}

function formatZodErrors(error: z.ZodError) {
  return error.issues.map((issue) => `${String(issue.path[0] ?? "row")}: ${issue.message}`);
}

export function parseQuestionImportCsv(csv: string): QuestionImportParseResult {
  if (!csv.trim()) return { success: false, errors: { File: ["The CSV file is empty"] } };
  if (new TextEncoder().encode(csv).byteLength > QUESTION_IMPORT_MAX_BYTES) return { success: false, errors: { File: ["CSV file cannot exceed 4 MB"] } };

  let records: string[][];
  try { records = parseCsvRecords(csv); }
  catch (error) { return { success: false, errors: { File: [error instanceof Error ? error.message : "The CSV could not be read"] } }; }
  if (records.length < 2) return { success: false, errors: { File: ["Add at least one question row below the header"] } };
  if (records.length - 1 > QUESTION_IMPORT_MAX_ROWS) return { success: false, errors: { File: [`Import at most ${QUESTION_IMPORT_MAX_ROWS} questions at a time`] } };

  const headers = records[0].map((header) => header.trim().toLowerCase());
  const errors: Record<string, string[]> = {};
  const duplicates = headers.filter((header, index) => headers.indexOf(header) !== index);
  const missing = requiredHeaders.filter((header) => !headers.includes(header));
  const unexpected = headers.filter((header) => !requiredHeaders.includes(header as typeof requiredHeaders[number]) && !optionalHeaders.has(header) && !/^option_(?:[1-9]|1[0-2])$/.test(header));
  if (duplicates.length) errors.Header = [`Duplicate columns: ${[...new Set(duplicates)].join(", ")}`];
  if (missing.length) errors.Header = [...(errors.Header ?? []), `Missing required columns: ${missing.join(", ")}`];
  if (unexpected.length) errors.Header = [...(errors.Header ?? []), `Unknown columns: ${unexpected.join(", ")}`];
  if (Object.keys(errors).length) return { success: false, errors };

  const rows: QuestionImportRow[] = [];
  records.slice(1).forEach((record, recordIndex) => {
    const rowNumber = recordIndex + 2;
    const raw = Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ""]));
    const parsed = csvRowSchema.safeParse(raw);
    const rowErrors = parsed.success ? [] : formatZodErrors(parsed.error);
    if (record.length > headers.length) rowErrors.push("row: Too many values; quote any value that contains a comma");

    const optionValues = Array.from({ length: 12 }, (_, index) => String(raw[`option_${index + 1}`] ?? "").trim());
    const lastOption = optionValues.findLastIndex(Boolean);
    const options = optionValues.slice(0, lastOption + 1);
    if (options.length < 2) rowErrors.push("options: Add at least option_1 and option_2");
    const gap = options.findIndex((value) => !value);
    if (gap >= 0) rowErrors.push(`option_${gap + 1}: Options must be filled in order without gaps`);
    options.forEach((option, index) => {
      if (option.length > 2_000) rowErrors.push(`option_${index + 1}: Option cannot exceed 2000 characters`);
      if (/[<>\u0000-\u001f\u007f]/u.test(option)) rowErrors.push(`option_${index + 1}: Option contains unsupported characters`);
    });

    const correctOptions = String(raw.correct_options ?? "").split(/[|;,\s]+/).filter(Boolean).map(Number);
    if (correctOptions.some((value) => !Number.isInteger(value) || value < 1 || value > options.length)) rowErrors.push("correct_options: Use valid option numbers such as 1 or 1|3");
    if (new Set(correctOptions).size !== correctOptions.length) rowErrors.push("correct_options: Do not repeat option numbers");

    if (parsed.success) {
      if (parsed.data.question_type === "single_choice" && correctOptions.length !== 1) rowErrors.push("correct_options: Single-choice questions require exactly one correct option");
      if (parsed.data.question_type === "multiple_choice" && correctOptions.length < 1) rowErrors.push("correct_options: Multiple-choice questions require at least one correct option");
      if (parsed.data.question_type === "true_false") {
        const labels = options.map((value) => value.toLowerCase()).sort();
        if (options.length !== 2 || labels[0] !== "false" || labels[1] !== "true") rowErrors.push("options: True/false questions require exactly True and False");
        if (correctOptions.length !== 1) rowErrors.push("correct_options: Select either True or False as correct");
      }
    }

    const tags = String(raw.tags ?? "").split("|").map((value) => value.trim()).filter(Boolean);
    if (tags.length > 20 || tags.some((tag) => tag.length > 60)) rowErrors.push("tags: Use at most 20 pipe-separated tags of 60 characters each");

    if (!parsed.success || rowErrors.length) {
      errors[`Row ${rowNumber}`] = [...new Set(rowErrors)];
      return;
    }

    rows.push({
      rowNumber,
      exam: { code: parsed.data.exam_code.toUpperCase(), name: parsed.data.exam_name, totalMarks: parsed.data.exam_total_marks, targetScore: parsed.data.exam_target_score, durationMinutes: parsed.data.exam_duration_minutes },
      subject: { code: parsed.data.subject_code.toUpperCase(), name: parsed.data.subject_name },
      topicName: parsed.data.topic_name,
      subtopicName: parsed.data.subtopic_name || null,
      question: {
        type: parsed.data.question_type,
        difficulty: parsed.data.difficulty,
        prompt: parsed.data.question,
        options: options.map((text, index) => ({ text, isCorrect: correctOptions.includes(index + 1), displayOrder: index })),
        explanation: parsed.data.explanation,
        tags,
        source: parsed.data.source,
        reference: parsed.data.reference,
        estimatedTimeSeconds: parsed.data.estimated_time_seconds,
        isActive: parsed.data.is_active,
      },
    });
  });

  return Object.keys(errors).length ? { success: false, errors } : { success: true, rows };
}
