import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { reportService } from "./reportService";
import { insertQuizSessionSchema, insertQuizResultSchema, type Question } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1'
});

// Chat message schema
const chatMessageSchema = z.object({
  message: z.string(),
  category: z.string(),
  questionType: z.string(),
  sessionId: z.number().optional(),
  answers: z.record(z.string()).optional(),
});

async function calculateAIEfficiencyScore(answers: Record<string, string>, questions: any[]): Promise<number> {
  try {
    // Prepare the answers and questions for GPT analysis
    const assessmentData = questions.map(q => ({
      question: q.question,
      answer: answers[q.id.toString()] || "No answer provided",
      category: q.category
    }));

    const prompt = `As an AI assessment expert, analyze these survey responses about AI usage and provide a score from 0-100 that reflects the respondent's efficiency and effectiveness in using AI tools. Consider factors like understanding of AI capabilities, strategic application, and awareness of best practices.

Survey Responses:
${JSON.stringify(assessmentData, null, 2)}

Provide only a numeric score between 0 and 100.`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an AI assessment expert. Analyze survey responses and provide only a numeric score between 0-100."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 10,
      temperature: 0.3
    });

    const scoreText = response.choices[0]?.message?.content || "50";
    const score = parseInt(scoreText.replace(/[^0-9]/g, ''));
    return Math.min(Math.max(score, 0), 100); // Ensure score is between 0 and 100
  } catch (error) {
    console.error('Error calculating AI efficiency score:', error);
    return 50; // Default score if GPT analysis fails
  }
}

// Function to get AI chat response
async function getAIChatResponse(message: string, context: { 
  category: string; 
  questionType: string;
  sessionAnswers?: Record<string, string>;
  questions?: Question[];
}): Promise<string> {
  try {
    const systemPrompt = `You are an AI Audit Assistant for SPARK AI, a company specializing in helping businesses optimize their AI integration and automation processes. Your role is to:

1. Help users understand their AI audit assessment questions
2. Provide insights about AI implementation in different departments
3. Suggest specific tools and solutions for automation
4. Explain best practices for AI adoption
5. Guide users in improving their department's efficiency

Context:
- Category: ${context.category}
- Question Type: ${context.questionType}
${context.sessionAnswers ? `- Current Answers: ${JSON.stringify(context.sessionAnswers, null, 2)}` : ''}
${context.questions ? `- Available Questions: ${JSON.stringify(context.questions, null, 2)}` : ''}

Respond in a helpful, professional manner, focusing on practical solutions and actionable advice. When suggesting tools or improvements, be specific and explain the benefits.`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || "I apologize, but I'm having trouble generating a response. Please try asking your question again.";
  } catch (error) {
    console.error('Error getting AI chat response:', error);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Chat endpoint
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, category, questionType, sessionId, answers } = chatMessageSchema.parse(req.body);
      
      // Get additional context if sessionId is provided
      let questions: Question[] = [];
      let sessionAnswers = answers;
      
      if (sessionId) {
        questions = await storage.getAllQuestions();
        if (!sessionAnswers) {
          const session = await storage.getQuizSession(sessionId);
          sessionAnswers = session?.answers as Record<string, string> || {};
        }
      }

      const response = await getAIChatResponse(message, {
        category,
        questionType,
        sessionAnswers,
        questions: questions.length > 0 ? questions : undefined
      });

      res.json({ response });
    } catch (error) {
      console.error('Chat API error:', error);
      res.status(500).json({ 
        error: 'Failed to get AI response',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

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
      const { userName, companyName, email, contactNumber } = req.body;
      
      const session = await storage.createQuizSession({
        startTime: new Date(),
        answers: {},
        currentQuestionIndex: 0,
        timeRemaining: 1800,
        isCompleted: false,
        userName,
        companyName,
        email,
        contactNumber
      });

      res.json(session);
    } catch (error) {
      console.error('Error creating quiz session:', error);
      res.status(500).json({ error: 'Failed to create quiz session' });
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
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const session = await storage.getQuizSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Quiz session not found" });
      }

      const questions = await storage.getAllQuestions();
      const answers = session.answers as Record<string, string>;
      
      // Calculate regular scores
      let correctAnswers = 0;
      let totalAnsweredQuestions = 0;
      const categoryScores: Record<string, { correct: number; total: number }> = {};
      
      // Initialize category scores
      questions.forEach(q => {
        if (!categoryScores[q.category]) {
          categoryScores[q.category] = { correct: 0, total: 0 };
        }
      });
      
      // Calculate scores only for answered questions
      Object.entries(answers).forEach(([questionId, answer]) => {
        const question = questions.find(q => q.id.toString() === questionId);
        if (!question) return;
        
        totalAnsweredQuestions++;
        const isCorrect = answer === question.correctAnswer;
        
        if (isCorrect) {
          correctAnswers++;
        }
        
        categoryScores[question.category].total++;
        if (isCorrect) {
          categoryScores[question.category].correct++;
        }
      });

      // Ensure we have valid numbers for calculations
      const totalQuestions = Math.max(1, totalAnsweredQuestions); // Prevent division by zero
      const overallScore = Math.round((correctAnswers / totalQuestions) * 100);

      console.log('Score calculation:', {
        totalQuestions,
        correctAnswers,
        overallScore,
        totalAnsweredQuestions
      });

      // Calculate AI efficiency score using GPT
      let aiEfficiencyScore = 50; // Default score
      try {
        const calculatedScore = await calculateAIEfficiencyScore(answers, questions);
        console.log('AI Efficiency calculation:', { calculatedScore });
        
        // Ensure it's a valid integer between 0 and 100
        aiEfficiencyScore = Math.max(0, Math.min(100, Math.round(Number(calculatedScore) || 50)));
        console.log('Final AI Efficiency score:', aiEfficiencyScore);
      } catch (error) {
        console.error('Error calculating AI efficiency score:', error);
      }
      
      // Update session as completed
      await storage.updateQuizSession(sessionId, {
        isCompleted: true,
        endTime: new Date(),
        score: Math.max(0, Math.min(100, overallScore)),
        categoryScores
      });

      // Prepare quiz result data
      const quizResultData = {
        sessionId,
        totalQuestions,
        correctAnswers,
        overallScore: Math.max(0, Math.min(100, overallScore)),
        categoryBreakdown: categoryScores,
        aiEfficiencyScore
      };

      console.log('Creating quiz result with data:', quizResultData);

      // Create quiz result
      const result = await storage.createQuizResult(quizResultData);
      
      // Generate and send AI audit report
      try {
        await reportService.generateAndSendReport(session, questions, result);
        console.log('AI audit report generated and sent successfully');
      } catch (reportError) {
        console.error('Failed to generate/send report:', reportError);
        // Don't fail the quiz submission if report generation fails
      }
      
      res.json({
        ...result,
        sessionId
      });
    } catch (err) {
      const error = err as Error;
      console.error('Error submitting quiz:', error);
      res.status(500).json({ 
        message: "Failed to submit quiz", 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      });
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
