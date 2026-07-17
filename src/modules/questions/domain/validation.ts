import { questionSchema } from "../schemas/question-schema";

export function validateQuestionRules(input: unknown) { return questionSchema.safeParse(input); }
