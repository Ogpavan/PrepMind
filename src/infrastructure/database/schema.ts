import { relations, sql } from "drizzle-orm";
import {
  AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["SUPER_ADMIN", "ADMIN", "STUDENT"]);
export const questionTypeEnum = pgEnum("question_type", ["single_choice", "multiple_choice", "true_false"]);
export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const sessionStatusEnum = pgEnum("session_status", ["created", "in_progress", "completed", "abandoned"]);

const auditTimestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").default("STUDENT").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...auditTimestamps(),
  },
  (table) => [uniqueIndex("users_email_lower_unique").on(sql`lower(${table.email})`), index("users_role_active_idx").on(table.role, table.isActive)],
);

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    identifier: varchar("identifier", { length: 320 }).notNull(),
    ipAddress: varchar("ip_address", { length: 64 }).notNull(),
    successful: boolean("successful").default(false).notNull(),
    attemptedAt: timestamp("attempted_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("login_attempts_lookup_idx").on(table.identifier, table.ipAddress, table.attemptedAt)],
);

export const exams = pgTable(
  "exams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 180 }).notNull(),
    code: varchar("code", { length: 40 }).notNull(),
    description: text("description").default("").notNull(),
    totalMarks: integer("total_marks").notNull(),
    targetScore: integer("target_score").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    ...auditTimestamps(),
  },
  (table) => [
    uniqueIndex("exams_code_lower_unique").on(sql`lower(${table.code})`),
    index("exams_active_name_idx").on(table.isActive, table.name),
    check("exams_marks_positive", sql`${table.totalMarks} > 0`),
    check("exams_target_valid", sql`${table.targetScore} >= 0 AND ${table.targetScore} <= ${table.totalMarks}`),
    check("exams_duration_positive", sql`${table.durationMinutes} > 0`),
  ],
);

export const subjects = pgTable(
  "subjects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    examId: uuid("exam_id").notNull().references(() => exams.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 180 }).notNull(),
    code: varchar("code", { length: 40 }).notNull(),
    description: text("description").default("").notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    ...auditTimestamps(),
  },
  (table) => [
    uniqueIndex("subjects_exam_name_lower_unique").on(table.examId, sql`lower(${table.name})`),
    uniqueIndex("subjects_exam_code_lower_unique").on(table.examId, sql`lower(${table.code})`),
    index("subjects_exam_active_order_idx").on(table.examId, table.isActive, table.displayOrder),
  ],
);

export const topics = pgTable(
  "topics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    subjectId: uuid("subject_id").notNull().references(() => subjects.id, { onDelete: "restrict" }),
    parentTopicId: uuid("parent_topic_id").references((): AnyPgColumn => topics.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 180 }).notNull(),
    description: text("description").default("").notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    ...auditTimestamps(),
  },
  (table) => [
    index("topics_subject_parent_order_idx").on(table.subjectId, table.parentTopicId, table.displayOrder),
    index("topics_active_idx").on(table.isActive),
    check("topics_not_own_parent", sql`${table.id} <> ${table.parentTopicId}`),
  ],
);

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    examId: uuid("exam_id").notNull().references(() => exams.id, { onDelete: "restrict" }),
    subjectId: uuid("subject_id").notNull().references(() => subjects.id, { onDelete: "restrict" }),
    topicId: uuid("topic_id").notNull().references(() => topics.id, { onDelete: "restrict" }),
    subtopicId: uuid("subtopic_id").references(() => topics.id, { onDelete: "restrict" }),
    type: questionTypeEnum("type").notNull(),
    prompt: text("prompt").notNull(),
    explanation: text("explanation").default("").notNull(),
    difficulty: difficultyEnum("difficulty").notNull(),
    source: varchar("source", { length: 240 }).default("").notNull(),
    reference: varchar("reference", { length: 500 }).default("").notNull(),
    tags: text("tags").array().default(sql`'{}'::text[]`).notNull(),
    estimatedTimeSeconds: integer("estimated_time_seconds").default(60).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    ...auditTimestamps(),
  },
  (table) => [
    index("questions_filter_idx").on(table.examId, table.subjectId, table.topicId, table.difficulty, table.isActive),
    index("questions_subtopic_idx").on(table.subtopicId),
    index("questions_created_at_idx").on(table.createdAt),
    check("questions_time_positive", sql`${table.estimatedTimeSeconds} > 0`),
  ],
);

export const questionOptions = pgTable(
  "question_options",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    isCorrect: boolean("is_correct").default(false).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
  },
  (table) => [uniqueIndex("question_options_question_order_unique").on(table.questionId, table.displayOrder), index("question_options_question_idx").on(table.questionId)],
);

export type QuestionSnapshot = {
  prompt: string;
  type: "single_choice" | "multiple_choice" | "true_false";
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  subjectName: string;
  topicName: string;
  options: Array<{ id: string; text: string; displayOrder: number; isCorrect: boolean }>;
};

export const studySessions = pgTable(
  "study_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    examId: uuid("exam_id").notNull().references(() => exams.id, { onDelete: "restrict" }),
    subjectId: uuid("subject_id").references(() => subjects.id, { onDelete: "restrict" }),
    topicId: uuid("topic_id").references(() => topics.id, { onDelete: "restrict" }),
    difficulty: difficultyEnum("difficulty"),
    status: sessionStatusEnum("status").default("created").notNull(),
    isTimed: boolean("is_timed").default(false).notNull(),
    durationSeconds: integer("duration_seconds"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    abandonedAt: timestamp("abandoned_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("study_sessions_user_status_idx").on(table.userId, table.status, table.createdAt), index("study_sessions_exam_idx").on(table.examId)],
);

export const studySessionQuestions = pgTable(
  "study_session_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id").notNull().references(() => studySessions.id, { onDelete: "cascade" }),
    questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "restrict" }),
    questionOrder: integer("question_order").notNull(),
    snapshot: jsonb("snapshot").$type<QuestionSnapshot>().notNull(),
  },
  (table) => [
    uniqueIndex("session_questions_order_unique").on(table.sessionId, table.questionOrder),
    uniqueIndex("session_questions_question_unique").on(table.sessionId, table.questionId),
    index("session_questions_session_idx").on(table.sessionId),
  ],
);

export const attempts = pgTable(
  "attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id").notNull().references(() => studySessions.id, { onDelete: "restrict" }),
    sessionQuestionId: uuid("session_question_id").notNull().references(() => studySessionQuestions.id, { onDelete: "restrict" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "restrict" }),
    selectedOptionIds: uuid("selected_option_ids").array().default(sql`'{}'::uuid[]`).notNull(),
    isCorrect: boolean("is_correct"),
    isSkipped: boolean("is_skipped").default(false).notNull(),
    responseTimeSeconds: integer("response_time_seconds").default(0).notNull(),
    answeredAt: timestamp("answered_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("attempts_session_question_unique").on(table.sessionQuestionId),
    index("attempts_user_answered_idx").on(table.userId, table.answeredAt),
    index("attempts_question_idx").on(table.questionId),
    index("attempts_session_idx").on(table.sessionId),
    check("attempts_response_time_nonnegative", sql`${table.responseTimeSeconds} >= 0`),
    check("attempts_skip_correctness_consistent", sql`(${table.isSkipped} = false) OR (${table.isCorrect} IS NULL)`),
  ],
);

export const appSettings = pgTable("app_settings", {
  key: varchar("key", { length: 120 }).primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const examsRelations = relations(exams, ({ many }) => ({ subjects: many(subjects), questions: many(questions) }));
export const subjectsRelations = relations(subjects, ({ one, many }) => ({ exam: one(exams, { fields: [subjects.examId], references: [exams.id] }), topics: many(topics), questions: many(questions) }));
export const topicsRelations = relations(topics, ({ one, many }) => ({ subject: one(subjects, { fields: [topics.subjectId], references: [subjects.id] }), parent: one(topics, { fields: [topics.parentTopicId], references: [topics.id], relationName: "topicTree" }), children: many(topics, { relationName: "topicTree" }) }));
export const questionsRelations = relations(questions, ({ one, many }) => ({ exam: one(exams, { fields: [questions.examId], references: [exams.id] }), subject: one(subjects, { fields: [questions.subjectId], references: [subjects.id] }), topic: one(topics, { fields: [questions.topicId], references: [topics.id], relationName: "questionTopic" }), subtopic: one(topics, { fields: [questions.subtopicId], references: [topics.id], relationName: "questionSubtopic" }), options: many(questionOptions) }));
export const questionOptionsRelations = relations(questionOptions, ({ one }) => ({ question: one(questions, { fields: [questionOptions.questionId], references: [questions.id] }) }));
export const studySessionsRelations = relations(studySessions, ({ one, many }) => ({ user: one(users, { fields: [studySessions.userId], references: [users.id] }), questions: many(studySessionQuestions), attempts: many(attempts) }));
export const studySessionQuestionsRelations = relations(studySessionQuestions, ({ one }) => ({ session: one(studySessions, { fields: [studySessionQuestions.sessionId], references: [studySessions.id] }), question: one(questions, { fields: [studySessionQuestions.questionId], references: [questions.id] }), attempt: one(attempts) }));
export const attemptsRelations = relations(attempts, ({ one }) => ({ session: one(studySessions, { fields: [attempts.sessionId], references: [studySessions.id] }), sessionQuestion: one(studySessionQuestions, { fields: [attempts.sessionQuestionId], references: [studySessionQuestions.id] }), question: one(questions, { fields: [attempts.questionId], references: [questions.id] }), user: one(users, { fields: [attempts.userId], references: [users.id] }) }));

export type User = typeof users.$inferSelect;
export type Exam = typeof exams.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Topic = typeof topics.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type StudySession = typeof studySessions.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
