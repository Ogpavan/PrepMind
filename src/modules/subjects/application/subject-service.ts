import { examRepository } from "@/modules/exams/infrastructure/exam-repository";
import { ApplicationError } from "@/shared/errors/application-error";
import type { PaginationInput } from "@/shared/types/pagination";
import { cleanText } from "@/shared/utils/text";
import { subjectRepository } from "../infrastructure/subject-repository";
import { subjectSchema, type SubjectInput } from "../schemas/subject-schema";

function mapValues(input: SubjectInput, actorId: string) { return { examId: input.examId, name: cleanText(input.name), code: input.code.trim().toUpperCase(), description: cleanText(input.description), displayOrder: input.displayOrder, isActive: input.isActive, updatedBy: actorId, updatedAt: new Date() }; }
export const subjectService = {
  list: (input?: PaginationInput & { examId?: string }) => subjectRepository.list(input),
  findById: (id: string) => subjectRepository.findById(id),
  listByExam: (examId: string, activeOnly = true) => subjectRepository.listByExam(examId, activeOnly),
  async save(raw: unknown, actorId: string) { const parsed = subjectSchema.safeParse(raw); if (!parsed.success) throw new ApplicationError("VALIDATION", "Check the highlighted fields.", parsed.error.flatten().fieldErrors); if (!await examRepository.findById(parsed.data.examId)) throw new ApplicationError("VALIDATION", "Selected exam does not exist.", { examId: ["Select a valid exam"] }); try { if (parsed.data.id) { const item = await subjectRepository.update(parsed.data.id, mapValues(parsed.data, actorId)); if (!item) throw new ApplicationError("NOT_FOUND", "Subject not found."); return item; } return subjectRepository.create({ ...mapValues(parsed.data, actorId), createdBy: actorId }); } catch (error) { if (typeof error === "object" && error && "code" in error && error.code === "23505") throw new ApplicationError("CONFLICT", "A subject with this name or code already exists in the exam."); throw error; } },
  async toggle(id: string, active: boolean, actorId: string) { const item = await subjectRepository.update(id, { isActive: active, updatedBy: actorId, updatedAt: new Date() }); if (!item) throw new ApplicationError("NOT_FOUND", "Subject not found."); return item; },
};
