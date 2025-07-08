import OpenAI from 'openai';
import type { Question } from './schema.js';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1'
});

export async function calculateAIEfficiencyScore(answers: Record<string, string>, questions: any[]): Promise<number> {
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
export async function getAIChatResponse(message: string, context: { 
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