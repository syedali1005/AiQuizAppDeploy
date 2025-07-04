import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './shared/schema';
import dotenv from 'dotenv';
import { eq } from 'drizzle-orm';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function checkQuizResults() {
  try {
    // Get all quiz sessions
    const sessions = await db.select().from(schema.quizSessions);
    
    console.log(`\nTotal Quiz Sessions: ${sessions.length}`);

    for (const session of sessions) {
      console.log('\n========================================');
      console.log(`Session ID: ${session.id}`);
      console.log('========================================');
      
      console.log('\n--- Quiz Session Details ---');
      console.log(`Start Time: ${session.startTime}`);
      console.log(`End Time: ${session.endTime || 'Not completed'}`);
      console.log(`Completed: ${session.isCompleted}`);
      console.log(`Score: ${session.score !== null ? session.score : 'Not scored'}`);
      
      // Show user details if available
      if (session.userName || session.email || session.companyName) {
        console.log('\nUser Details:');
        if (session.userName) console.log(`Name: ${session.userName}`);
        if (session.email) console.log(`Email: ${session.email}`);
        if (session.companyName) console.log(`Company: ${session.companyName}`);
        if (session.contactNumber) console.log(`Contact: ${session.contactNumber}`);
      }
      
      if (session.isCompleted) {
        // Get detailed results for completed sessions
        const results = await db.select()
          .from(schema.quizResults)
          .where(eq(schema.quizResults.sessionId, session.id));

        if (results.length > 0) {
          const result = results[0];
          console.log('\nDetailed Results:');
          console.log(`Total Questions: ${result.totalQuestions}`);
          console.log(`Correct Answers: ${result.correctAnswers}`);
          console.log(`Overall Score: ${result.overallScore}%`);
          console.log(`AI Efficiency Score: ${result.aiEfficiencyScore}`);
          console.log('\nCategory Breakdown:');
          const breakdown = result.categoryBreakdown as Record<string, { score: number, total: number }>;
          Object.entries(breakdown).forEach(([category, data]) => {
            console.log(`${category}: Score=${data.score}/${data.total}`);
          });
          console.log(`Completed At: ${result.completedAt}`);
        }
      }

      // Show answers if any
      const answers = session.answers as Record<string, unknown>;
      if (Object.keys(answers).length > 0) {
        console.log('\nAnswers Submitted:');
        Object.entries(answers).forEach(([questionId, answer]) => {
          console.log(`Question ${questionId}: ${answer}`);
        });
      }
    }

    if (sessions.length === 0) {
      console.log('\nNo quiz sessions found in the database.');
    }

  } catch (error) {
    console.error('Error checking quiz results:', error);
  }
  process.exit(0);
}

checkQuizResults(); 