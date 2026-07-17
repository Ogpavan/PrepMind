import { examRepository } from "../infrastructure/exam-repository";
import { examSchema, type ExamInput } from "../schemas/exam-schema";
import { ApplicationError } from "@/shared/errors/application-error";
import { cleanText } from "@/shared/utils/text";
import type { PaginationInput } from "@/shared/types/pagination";

function mapValues(input: ExamInput, actorId: string) { return { name: cleanText(input.name), code: input.code.trim().toUpperCase(), description: cleanText(input.description), totalMarks: input.totalMarks, targetScore: input.targetScore, durationMinutes: input.durationMinutes, isActive: input.isActive, updatedBy: actorId, updatedAt: new Date() }; }

export const examService = {
  list: (input?: PaginationInput) => examRepository.list(input),
  listActive: () => examRepository.listActive(),
  findById: (id: string) => examRepository.findById(id),
  async save(raw: unknown, actorId: string) {
    const parsed = examSchema.safeParse(raw); if (!parsed.success) throw new ApplicationError("VALIDATION", "Check the highlighted fields.", parsed.error.flatten().fieldErrors);
    try { if (parsed.data.id) { const item = await examRepository.update(parsed.data.id, mapValues(parsed.data, actorId)); if (!item) throw new ApplicationError("NOT_FOUND", "Exam not found."); return item; } return examRepository.create({ ...mapValues(parsed.data, actorId), createdBy: actorId }); }
    catch (error) { if (typeof error === "object" && error && "code" in error && error.code === "23505") throw new ApplicationError("CONFLICT", "An exam with this code already exists."); throw error; }
  },
  async toggle(id: string, active: boolean, actorId: string) { const item = await examRepository.update(id, { isActive: active, updatedBy: actorId, updatedAt: new Date() }); if (!item) throw new ApplicationError("NOT_FOUND", "Exam not found."); return item; },
};
