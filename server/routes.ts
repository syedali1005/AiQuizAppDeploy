import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQuizSessionSchema, insertQuizResultSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all questions
  app.get("/api/questions", async (req, res) => {
    try {
      const questions = await storage.getAllQuestions();
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Get questions by category
  app.get("/api/questions/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const questions = await storage.getQuestionsByCategory(category);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions by category" });
    }
  });

  // Create new quiz session
  app.post("/api/quiz-sessions", async (req, res) => {
    try {
      const sessionData = insertQuizSessionSchema.parse(req.body);
      const session = await storage.createQuizSession(sessionData);
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid session data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create quiz session" });
      }
    }
  });

  // Get quiz session
  app.get("/api/quiz-sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.getQuizSession(id);
      if (!session) {
        return res.status(404).json({ message: "Quiz session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz session" });
    }
  });

  // Update quiz session
  app.patch("/api/quiz-sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const session = await storage.updateQuizSession(id, updates);
      if (!session) {
        return res.status(404).json({ message: "Quiz session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to update quiz session" });
    }
  });

  // Submit quiz and calculate results
  app.post("/api/quiz-sessions/:id/submit", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getQuizSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Quiz session not found" });
      }

      const questions = await storage.getAllQuestions();
      const answers = session.answers as Record<string, string>;
      
      // Calculate scores
      let correctAnswers = 0;
      const categoryScores: Record<string, { correct: number; total: number }> = {};
      
      questions.forEach((question) => {
        const userAnswer = answers[question.id.toString()];
        const isCorrect = userAnswer === question.correctAnswer;
        
        if (isCorrect) {
          correctAnswers++;
        }
        
        if (!categoryScores[question.category]) {
          categoryScores[question.category] = { correct: 0, total: 0 };
        }
        
        categoryScores[question.category].total++;
        if (isCorrect) {
          categoryScores[question.category].correct++;
        }
      });

      const overallScore = Math.round((correctAnswers / questions.length) * 100);
      
      // Update session as completed
      await storage.updateQuizSession(sessionId, {
        isCompleted: true,
        endTime: new Date(),
        score: overallScore,
        categoryScores
      });

      // Create quiz result
      const resultData = {
        sessionId,
        totalQuestions: questions.length,
        correctAnswers,
        overallScore,
        categoryBreakdown: categoryScores
      };

      const result = await storage.createQuizResult(resultData);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to submit quiz" });
    }
  });

  // Get quiz results
  app.get("/api/quiz-results/session/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const results = await storage.getQuizResultsBySession(sessionId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz results" });
    }
  });

  // Export quiz results as PDF (placeholder - would integrate with PDF library)
  app.get("/api/quiz-results/:id/export", async (req, res) => {
    try {
      const resultId = parseInt(req.params.id);
      // This would generate a PDF in a real implementation
      res.json({ 
        message: "PDF export functionality would be implemented here",
        downloadUrl: `/downloads/quiz-result-${resultId}.pdf`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to export results" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
