import { storage } from '../../lib/storage.js';

export default async function handler(req: any, res: any) {
  const { id } = req.query;
  
  if (req.method === 'GET') {
    try {
      const sessionId = parseInt(id as string);
      const session = await storage.getQuizSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Quiz session not found" });
      }
      
      return res.status(200).json(session);
    } catch (error) {
      console.error('Error fetching quiz session:', error);
      return res.status(500).json({ message: "Failed to fetch quiz session" });
    }
  }
  
  if (req.method === 'PATCH') {
    try {
      const sessionId = parseInt(id as string);
      const updates = req.body;
      const session = await storage.updateQuizSession(sessionId, updates);
      
      if (!session) {
        return res.status(404).json({ message: "Quiz session not found" });
      }
      
      return res.status(200).json(session);
    } catch (error) {
      console.error('Error updating quiz session:', error);
      return res.status(500).json({ message: "Failed to update quiz session" });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
} 