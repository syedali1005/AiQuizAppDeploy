import { storage } from '../../../lib/storage';
import { reportService } from '../../../lib/reportService';
import { calculateAIEfficiencyScore } from '../../../lib/aiService';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;
  try {
    const sessionId = parseInt(id as string);
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
    const totalQuestions = Math.max(1, totalAnsweredQuestions);
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
    
    return res.status(200).json({
      ...result,
      sessionId
    });
  } catch (err) {
    const error = err as Error;
    console.error('Error submitting quiz:', error);
    return res.status(500).json({ 
      message: "Failed to submit quiz", 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    });
  }
} 