import ExcelJS from "exceljs";
import JSZip from "jszip";
import { ApplicationError } from "@/shared/errors/application-error";
import { QUESTION_IMPORT_MAX_BYTES } from "../domain/question-csv-import";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function toArrayBuffer(buffer: Buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

function csvCell(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function worksheetToCsv(worksheet: ExcelJS.Worksheet) {
  const records: string[] = [];
  const columnCount = Math.max(worksheet.actualColumnCount, worksheet.columnCount);

  for (let rowNumber = 1; rowNumber <= worksheet.actualRowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const values = Array.from({ length: columnCount }, (_, index) => row.getCell(index + 1).text ?? "");
    while (values.length && !values.at(-1)?.trim()) values.pop();
    if (values.some((value) => value.trim())) records.push(values.map(csvCell).join(","));
  }

  return records.join("\n");
}

async function normalizePrefixedOpenXml(buffer: Buffer) {
  const archive = await JSZip.loadAsync(buffer);
  const xmlFiles = Object.keys(archive.files).filter((path) => path.endsWith(".xml"));

  for (const path of xmlFiles) {
    const file = archive.file(path);
    if (!file) continue;
    let xml = await file.async("string");
    xml = xml.replaceAll("<x:", "<").replaceAll("</x:", "</").replaceAll("xmlns:x=", "xmlns=");

    // Spreadsheet tables are presentation metadata and are not needed for
    // imports. Some third-party generators emit table XML that Excel accepts
    // but ExcelJS cannot hydrate, so discard table references in the fallback.
    const tableStart = xml.indexOf("<tableParts");
    const tableEnd = xml.indexOf("</tableParts>");
    if (tableStart >= 0 && tableEnd >= tableStart) xml = `${xml.slice(0, tableStart)}${xml.slice(tableEnd + "</tableParts>".length)}`;
    archive.file(path, xml);
  }

  return archive.generateAsync({ type: "nodebuffer" });
}

export async function xlsxBufferToCsv(input: Buffer) {
  let workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(toArrayBuffer(input));
  } catch {
    try {
      const normalized = await normalizePrefixedOpenXml(input);
      workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(toArrayBuffer(normalized));
    } catch {
      throw new ApplicationError("VALIDATION", "The Excel workbook could not be read. Upload a valid .xlsx file.", { File: ["The workbook is damaged or uses an unsupported Excel format"] });
    }
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new ApplicationError("VALIDATION", "The Excel workbook does not contain a worksheet.", { File: ["Add the questions to the first worksheet"] });
  return worksheetToCsv(worksheet);
}

export async function readQuestionImportFile(file: File) {
  if (!file.size) throw new ApplicationError("VALIDATION", "Choose a non-empty question sheet.", { File: ["The selected file is empty"] });
  if (file.size > QUESTION_IMPORT_MAX_BYTES) throw new ApplicationError("VALIDATION", "Question sheet cannot exceed 4 MB.", { File: ["Choose a file smaller than 4 MB"] });

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = file.name.toLocaleLowerCase().split(".").at(-1);
  const isZipWorkbook = buffer[0] === 0x50 && buffer[1] === 0x4b;
  if (extension === "xlsx" || file.type === XLSX_MIME || isZipWorkbook) return xlsxBufferToCsv(buffer);
  if (extension === "csv" || file.type === "text/csv" || file.type === "application/csv") return buffer.toString("utf8");
  throw new ApplicationError("VALIDATION", "Unsupported question sheet format.", { File: ["Upload a .csv or .xlsx file"] });
}
