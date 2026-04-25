import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";
import { users } from "./models/auth";

// Exams table - stores the three national exams
export const exams = pgTable("exams", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const examsRelations = relations(exams, ({ many }) => ({
  subjects: many(subjects),
}));

// Subjects table - subjects within each exam
export const subjects = pgTable("subjects", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  examId: integer("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  exam: one(exams, {
    fields: [subjects.examId],
    references: [exams.id],
  }),
  questions: many(questions),
}));

// Questions table - stores individual questions
export const questions = pgTable("questions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  subjectId: integer("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  imageUrl: text("image_url"),
  year: integer("year"),
  difficulty: varchar("difficulty", { length: 20 }),
  topic: varchar("topic", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const questionsRelations = relations(questions, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [questions.subjectId],
    references: [subjects.id],
  }),
  answers: many(answers),
}));

// Answers table - stores answers for each question
export const answers = pgTable("answers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  answerText: text("answer_text").notNull(),
  isCorrect: boolean("is_correct").default(false).notNull(),
  explanation: text("explanation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const answersRelations = relations(answers, ({ one }) => ({
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
}));

// Device Tokens table - stores FCM tokens from mobile apps for push notifications
export const deviceTokens = pgTable(
  "device_tokens",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    deviceToken: varchar("device_token", { length: 500 }).notNull(),
    platform: varchar("platform", { length: 20 }).notNull(), // 'android' or 'ios'
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("idx_device_token_unique").on(table.deviceToken)],
);

export const deviceTokensRelations = relations(deviceTokens, ({ one }) => ({
  user: one(users, {
    fields: [deviceTokens.userId],
    references: [users.id],
  }),
}));

// Insert schemas - defined manually for better type safety with generatedAlwaysAsIdentity
export const insertExamSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50),
  description: z.string().nullable().optional(),
});

export const insertSubjectSchema = z.object({
  examId: z.number(),
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50),
  description: z.string().nullable().optional(),
});

export const insertQuestionSchema = z.object({
  subjectId: z.number(),
  questionText: z.string().min(1),
  imageUrl: z.string().nullable().optional(),
  year: z.number().nullable().optional(),
  difficulty: z.string().max(20).nullable().optional(),
  topic: z.string().max(255).nullable().optional(),
});

export const insertAnswerSchema = z.object({
  questionId: z.number(),
  answerText: z.string().min(1),
  isCorrect: z.boolean().default(false),
  explanation: z.string().nullable().optional(),
});

export const insertDeviceTokenSchema = z.object({
  deviceToken: z.string().min(1).max(500),
  platform: z.enum(["android", "ios"]),
});

// Types
export type InsertExam = z.infer<typeof insertExamSchema>;
export type Exam = typeof exams.$inferSelect;

export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjects.$inferSelect;

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Answer = typeof answers.$inferSelect;

export type InsertDeviceToken = z.infer<typeof insertDeviceTokenSchema>;
export type DeviceToken = typeof deviceTokens.$inferSelect;

// Extended types with relations
export type QuestionWithAnswers = Question & { answers: Answer[] };
export type SubjectWithQuestions = Subject & { questions: QuestionWithAnswers[] };
export type ExamWithSubjects = Exam & { subjects: Subject[] };
