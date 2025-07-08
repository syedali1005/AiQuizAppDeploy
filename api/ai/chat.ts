import { getAIChatResponse } from '../../lib/aiService';
import { storage } from '../../lib/storage';
import { z } from 'zod';

const chatMessageSchema = z.object({
  message: z.string(),
  category: z.string(),
  questionType: z.string(),
  sessionId: z.number().optional(),
  answers: z.record(z.string()).optional(),
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { message, category, questionType, sessionId, answers } = chatMessageSchema.parse(req.body);
    
    // Get additional context if sessionId is provided
    let questions: any[] = [];
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

    return res.status(200).json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ 
      error: 'Failed to get AI response',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 