import { subjectRepository } from "@/modules/subjects/infrastructure/subject-repository";
import { ApplicationError } from "@/shared/errors/application-error";
import type { PaginationInput } from "@/shared/types/pagination";
import { cleanText } from "@/shared/utils/text";
import { topicRepository } from "../infrastructure/topic-repository";
import { topicSchema, type TopicInput } from "../schemas/topic-schema";

async function validateParent(input: TopicInput) {
  if (!await subjectRepository.findById(input.subjectId)) throw new ApplicationError("VALIDATION", "Selected subject does not exist.", { subjectId: ["Select a valid subject"] });
  if (!input.parentTopicId) return;
  let parentId: string | null = input.parentTopicId;
  const visited = new Set<string>();
  while (parentId) {
    const parent = await topicRepository.findById(parentId);
    if (!parent || parent.subjectId !== input.subjectId) throw new ApplicationError("VALIDATION", "Parent topic must belong to the selected subject.", { parentTopicId: ["Select a parent from this subject"] });
    if (input.id && parent.id === input.id) throw new ApplicationError("VALIDATION", "A circular topic relationship is not allowed.", { parentTopicId: ["Choose another parent"] });
    if (visited.has(parent.id)) throw new ApplicationError("CONFLICT", "The existing topic hierarchy contains a cycle.");
    visited.add(parent.id);
    parentId = parent.parentTopicId;
  }
}
function mapValues(input: TopicInput, actorId: string) { return { subjectId: input.subjectId, parentTopicId: input.parentTopicId, name: cleanText(input.name), description: cleanText(input.description), displayOrder: input.displayOrder, isActive: input.isActive, updatedBy: actorId, updatedAt: new Date() }; }
export const topicService = {
  list: (input?: PaginationInput & { examId?: string; subjectId?: string }) => topicRepository.list(input), listBySubject: (subjectId: string, activeOnly = true) => topicRepository.listBySubject(subjectId, activeOnly), listReference: () => topicRepository.listReference(),
  async save(raw: unknown, actorId: string) { const parsed = topicSchema.safeParse(raw); if (!parsed.success) throw new ApplicationError("VALIDATION", "Check the highlighted fields.", parsed.error.flatten().fieldErrors); await validateParent(parsed.data); if (parsed.data.id) { const item = await topicRepository.update(parsed.data.id, mapValues(parsed.data, actorId)); if (!item) throw new ApplicationError("NOT_FOUND", "Topic not found."); return item; } return topicRepository.create({ ...mapValues(parsed.data, actorId), createdBy: actorId }); },
  async toggle(id: string, active: boolean, actorId: string) { const item = await topicRepository.update(id, { isActive: active, updatedBy: actorId, updatedAt: new Date() }); if (!item) throw new ApplicationError("NOT_FOUND", "Topic not found."); return item; },
};
