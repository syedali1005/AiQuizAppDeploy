import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const quizSessions = pgTable("quiz_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  timeRemaining: integer("time_remaining").notNull().default(1800), // 30 minutes in seconds
  answers: jsonb("answers").notNull().default({}),
  isCompleted: boolean("is_completed").notNull().default(false),
  score: integer("score"),
  categoryScores: jsonb("category_scores").default({}),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  type: text("type").notNull(), // 'multiple-choice', 'true-false', 'short-answer'
  question: text("question").notNull(),
  options: jsonb("options"), // For multiple choice questions
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  order: integer("order").notNull(),
});

export const quizResults = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => quizSessions.id).notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  overallScore: integer("overall_score").notNull(),
  categoryBreakdown: jsonb("category_breakdown").notNull(),
  completedAt: timestamp("completed_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertQuizSessionSchema = createInsertSchema(quizSessions).omit({
  id: true,
  startTime: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertQuizResultSchema = createInsertSchema(quizResults).omit({
  id: true,
  completedAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type QuizSession = typeof quizSessions.$inferSelect;
export type InsertQuizSession = z.infer<typeof insertQuizSessionSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type QuizResult = typeof quizResults.$inferSelect;
export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;
