import { ApplicationError } from "@/shared/errors/application-error";
import { cleanText } from "@/shared/utils/text";
import { parseQuestionImportCsv, type QuestionImportRow } from "../domain/question-csv-import";
import { readQuestionImportFile } from "../infrastructure/question-import-file";
import { questionImportRepository } from "../infrastructure/question-import-repository";

function cleanRow(row: QuestionImportRow): QuestionImportRow {
  return {
    ...row,
    exam: { ...row.exam, name: cleanText(row.exam.name) },
    subject: { ...row.subject, name: cleanText(row.subject.name) },
    topicName: cleanText(row.topicName),
    subtopicName: row.subtopicName ? cleanText(row.subtopicName) : null,
    question: {
      ...row.question,
      prompt: cleanText(row.question.prompt),
      explanation: cleanText(row.question.explanation),
      source: cleanText(row.question.source),
      reference: cleanText(row.question.reference),
      tags: row.question.tags.map(cleanText).filter(Boolean),
      options: row.question.options.map((option) => ({ ...option, text: cleanText(option.text) })),
    },
  };
}

export const questionImportService = {
  async importFile(file: File, actorId: string) {
    const csv = await readQuestionImportFile(file);
    const parsed = parseQuestionImportCsv(csv);
    if (!parsed.success) throw new ApplicationError("VALIDATION", "Fix the CSV errors and try again.", parsed.errors);
    return questionImportRepository.import(parsed.rows.map(cleanRow), actorId);
  },
};
