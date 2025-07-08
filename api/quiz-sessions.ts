import { storage } from '../lib/storage';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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

    return res.status(200).json(session);
  } catch (error) {
    console.error('Error creating quiz session:', error);
    return res.status(500).json({ error: 'Failed to create quiz session' });
  }
} 