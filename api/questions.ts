import { storage } from '../lib/storage';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { category } = req.query;
    
    if (category && typeof category === 'string') {
      const questions = await storage.getQuestionsByCategory(category);
      return res.status(200).json(questions);
    } else {
      const questions = await storage.getAllQuestions();
      return res.status(200).json(questions);
    }
  } catch (error) {
    console.error('Error fetching questions:', error);
    return res.status(500).json({ message: "Failed to fetch questions" });
  }
} 