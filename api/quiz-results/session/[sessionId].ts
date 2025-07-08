import { storage } from '../../../lib/storage';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.query;
    const sessionIdNum = parseInt(sessionId as string);
    const results = await storage.getQuizResultsBySession(sessionIdNum);
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    return res.status(500).json({ message: "Failed to fetch quiz results" });
  }
} 