import { examRepository } from "@/modules/exams/infrastructure/exam-repository";
import { subjectRepository } from "@/modules/subjects/infrastructure/subject-repository";
import { topicRepository } from "@/modules/topics/infrastructure/topic-repository";
import { ApplicationError } from "@/shared/errors/application-error";
import { hasDatabaseErrorCode } from "@/shared/errors/database-error";
import type { PaginationInput } from "@/shared/types/pagination";
import { cleanText } from "@/shared/utils/text";
import { questionRepository } from "../infrastructure/question-repository";
import { questionSchema, type ParsedQuestionInput } from "../schemas/question-schema";
import { z } from "zod";

async function validateHierarchy(input: ParsedQuestionInput) { const [exam, subject, topic, subtopic] = await Promise.all([examRepository.findById(input.examId), subjectRepository.findById(input.subjectId), topicRepository.findById(input.topicId), input.subtopicId ? topicRepository.findById(input.subtopicId) : null]); if (!exam) throw new ApplicationError("VALIDATION", "Selected exam does not exist.", { examId: ["Select a valid exam"] }); if (!subject || subject.examId !== input.examId) throw new ApplicationError("VALIDATION", "Subject must belong to the selected exam.", { subjectId: ["Select a subject from this exam"] }); if (!topic || topic.subjectId !== input.subjectId || topic.parentTopicId) throw new ApplicationError("VALIDATION", "Topic must be a top-level topic in the selected subject.", { topicId: ["Select a valid topic"] }); if (input.subtopicId && (!subtopic || subtopic.subjectId !== input.subjectId || subtopic.parentTopicId !== input.topicId)) throw new ApplicationError("VALIDATION", "Subtopic must belong to the selected topic.", { subtopicId: ["Select a subtopic under this topic"] }); }
function mapQuestion(input: ParsedQuestionInput, actorId: string) { return { examId: input.examId, subjectId: input.subjectId, topicId: input.topicId, subtopicId: input.subtopicId, type: input.type, prompt: cleanText(input.prompt), explanation: cleanText(input.explanation), difficulty: input.difficulty, source: cleanText(input.source), reference: cleanText(input.reference), tags: input.tags.map(cleanText).filter(Boolean), estimatedTimeSeconds: input.estimatedTimeSeconds, isActive: input.isActive, archivedAt: null, updatedBy: actorId, updatedAt: new Date() }; }
export const questionService = {
  list: (input?: PaginationInput & { examId?: string; subjectId?: string; topicId?: string; difficulty?: "easy" | "medium" | "hard"; status?: string; sort?: string }) => questionRepository.list(input),
  findById: (id: string) => questionRepository.findById(id), countStats: () => questionRepository.countStats(), recent: (limit?: number) => questionRepository.recent(limit),
  async save(raw: unknown, actorId: string) { const parsed = questionSchema.safeParse(raw); if (!parsed.success) throw new ApplicationError("VALIDATION", "Check the highlighted fields.", parsed.error.flatten().fieldErrors); await validateHierarchy(parsed.data); const options = parsed.data.options.map((option, index) => ({ id: option.id, text: cleanText(option.text), isCorrect: option.isCorrect, displayOrder: index })); const saved = await questionRepository.save(parsed.data.id, { ...mapQuestion(parsed.data, actorId), createdBy: parsed.data.id ? undefined : actorId }, options); if (!saved) throw new ApplicationError("NOT_FOUND", "Question not found."); return saved; },
  async duplicate(id: string, actorId: string) { const source = await questionRepository.findById(id); if (!source) throw new ApplicationError("NOT_FOUND", "Question not found."); return this.save({ ...source, id: undefined, prompt: `${source.prompt} (Copy)`, isActive: false, options: source.options.map((option) => ({ text: option.text, isCorrect: option.isCorrect, displayOrder: option.displayOrder })) }, actorId); },
  async archive(ids: string[], actorId: string) { return questionRepository.updateState(ids, { isActive: false, archivedAt: new Date(), updatedBy: actorId, updatedAt: new Date() }); },
  async restore(ids: string[], actorId: string) { return questionRepository.updateState(ids, { isActive: true, archivedAt: null, updatedBy: actorId, updatedAt: new Date() }); },
  async activate(ids: string[], actorId: string) { return questionRepository.updateState(ids, { isActive: true, archivedAt: null, updatedBy: actorId, updatedAt: new Date() }); },
  async remove(ids: string[]) {
    const parsed = z.array(z.uuid()).min(1).max(100).safeParse([...new Set(ids)]);
    if (!parsed.success) throw new ApplicationError("VALIDATION", "Select between 1 and 100 valid questions to delete.");
    const referencedIds = await questionRepository.findReferencedIds(parsed.data);
    if (referencedIds.length) throw new ApplicationError("CONFLICT", `${referencedIds.length} selected question${referencedIds.length === 1 ? " is" : "s are"} used in study history. Nothing was deleted; archive ${referencedIds.length === 1 ? "it" : "them"} instead.`);
    try { return await questionRepository.deleteMany(parsed.data); }
    catch (error) {
      if (hasDatabaseErrorCode(error, "23503")) throw new ApplicationError("CONFLICT", "A selected question was added to study history before deletion completed. Nothing was deleted; archive it instead.");
      throw error;
    }
  },
};
