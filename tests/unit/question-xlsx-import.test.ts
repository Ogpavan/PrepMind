import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { questionImportHeaders, parseQuestionImportCsv } from "@/modules/questions/domain/question-csv-import";
import { xlsxBufferToCsv } from "@/modules/questions/infrastructure/question-import-file";

describe("question Excel import", () => {
  it("converts the first worksheet into the validated import format", async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Questions");
    worksheet.addRow(questionImportHeaders);
    worksheet.addRow([
      "UP_POLICE_CO", "UP Police Computer Operator Grade-A", 200, 140, 120,
      "COMPUTER", "Computer Science", "Fundamentals of Computer", "Computer Basics",
      "single_choice", "easy", "Which statement best defines a computer?",
      "A calculator", "An electronic data-processing device", "A typewriter", "A telephone",
      2, "A computer accepts input, processes it, and produces output.",
      "computer-basics|definition", "Question bank", "Chapter 1", 40, true,
    ]);

    const csv = await xlsxBufferToCsv(Buffer.from(await workbook.xlsx.writeBuffer()));
    const result = parseQuestionImportCsv(csv);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].question.options[1]).toMatchObject({ text: "An electronic data-processing device", isCorrect: true });
  });
});
