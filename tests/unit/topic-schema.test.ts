import { describe, expect, it } from "vitest";
import { topicSchema } from "@/modules/topics/schemas/topic-schema";

const validTopic = {
  subjectId: crypto.randomUUID(),
  parentTopicId: null,
  name: "Algebra",
  description: "Core algebra concepts",
  displayOrder: 0,
  isActive: true,
};

describe("topic validation", () => {
  it("accepts a valid topic", () => {
    expect(topicSchema.safeParse(validTopic).success).toBe(true);
  });

  it.each(["", "A", "   ", "<>" , "<script>", "---"])("rejects invalid topic name %j", (name) => {
    expect(topicSchema.safeParse({ ...validTopic, name }).success).toBe(false);
  });

  it.each(["", null, -1, 1.5])("rejects invalid display order %j", (displayOrder) => {
    expect(topicSchema.safeParse({ ...validTopic, displayOrder }).success).toBe(false);
  });
});
