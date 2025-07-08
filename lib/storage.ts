import { db } from './db.js';
import { 
  users, 
  quizSessions, 
  questions, 
  quizResults,
  type User, 
  type InsertUser, 
  type QuizSession, 
  type InsertQuizSession,
  type Question,
  type InsertQuestion,
  type QuizResult,
  type InsertQuizResult
} from "./schema.js";
import { eq, asc, sql } from 'drizzle-orm';

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Quiz Session methods
  createQuizSession(session: InsertQuizSession): Promise<QuizSession>;
  getQuizSession(id: number): Promise<QuizSession | undefined>;
  updateQuizSession(id: number, updates: Partial<InsertQuizSession>): Promise<QuizSession | undefined>;
  
  // Question methods
  getAllQuestions(): Promise<Question[]>;
  getQuestionsByCategory(category: string): Promise<Question[]>;
  
  // Quiz Result methods
  createQuizResult(result: InsertQuizResult): Promise<QuizResult>;
  getQuizResultsBySession(sessionId: number): Promise<QuizResult[]>;
}

export class DrizzleStorage implements IStorage {
  private initialized = false;

  private async initialize() {
    if (this.initialized) return;
    
    try {
      await this.initializeQuestions();
      await this.updateFirstQuestion();
      this.initialized = true;
    } catch (error) {
      console.error('Storage initialization error:', error);
      throw error;
    }
  }

  private async initializeQuestions() {
    try {
      const countResult = await db.select({ count: sql<number>`count(*)` }).from(questions);
      const questionCount = countResult[0].count;

      if (questionCount > 0) {
        console.log('Questions already exist in the database. Skipping initialization.');
        return;
      }

      console.log('No questions found. Initializing database with sample questions...');
      const sampleQuestions = getSampleQuestions();
      await db.insert(questions).values(sampleQuestions);
      console.log('Successfully inserted sample questions into the database.');

    } catch (error) {
      console.error('Error initializing questions:', error);
    }
  }

  private async updateFirstQuestion() {
    try {
      await db.update(questions)
        .set({
          type: 'text',
          question: 'Please provide your company website URL:'
        })
        .where(eq(questions.id, 1));
      console.log('Successfully updated the first question');
    } catch (error) {
      console.error('Error updating first question:', error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    await this.initialize();
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.initialize();
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await this.initialize();
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Quiz Session methods
  async createQuizSession(insertSession: InsertQuizSession): Promise<QuizSession> {
    await this.initialize();
    try {
      const result = await db.insert(quizSessions).values({
        ...insertSession,
        startTime: new Date(),
        answers: {},
        currentQuestionIndex: 0,
        timeRemaining: 1800,
        isCompleted: false
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error in createQuizSession:', error);
      throw error;
    }
  }

  async getQuizSession(id: number): Promise<QuizSession | undefined> {
    await this.initialize();
    const result = await db.select().from(quizSessions).where(eq(quizSessions.id, id));
    return result[0];
  }

  async updateQuizSession(id: number, updates: Partial<InsertQuizSession>): Promise<QuizSession | undefined> {
    await this.initialize();
    const result = await db.update(quizSessions).set(updates).where(eq(quizSessions.id, id)).returning();
    return result[0];
  }

  // Question methods
  async getAllQuestions(): Promise<Question[]> {
    await this.initialize();
    return db.select().from(questions).orderBy(asc(questions.order));
  }

  async getQuestionsByCategory(category: string): Promise<Question[]> {
    await this.initialize();
    return db.select().from(questions).where(eq(questions.category, category)).orderBy(asc(questions.order));
  }

  // Quiz Result methods
  async createQuizResult(insertResult: InsertQuizResult): Promise<QuizResult> {
    await this.initialize();
    try {
      console.log('Raw quiz result data:', insertResult);

      // Convert and validate each field individually
      const sessionId = Number(insertResult.sessionId);
      const totalQuestions = Math.max(0, Math.round(Number(insertResult.totalQuestions)));
      const correctAnswers = Math.max(0, Math.round(Number(insertResult.correctAnswers)));
      const overallScore = Math.max(0, Math.min(100, Math.round(Number(insertResult.overallScore))));
      const aiEfficiencyScore = Math.max(0, Math.min(100, Math.round(Number(insertResult.aiEfficiencyScore) || 50)));

      console.log('Validated numbers:', {
        sessionId,
        totalQuestions,
        correctAnswers,
        overallScore,
        aiEfficiencyScore
      });

      // Verify no NaN values
      if (isNaN(sessionId)) throw new Error('Invalid sessionId');
      if (isNaN(totalQuestions)) throw new Error('Invalid totalQuestions');
      if (isNaN(correctAnswers)) throw new Error('Invalid correctAnswers');
      if (isNaN(overallScore)) throw new Error('Invalid overallScore');
      if (isNaN(aiEfficiencyScore)) throw new Error('Invalid aiEfficiencyScore');

      const validatedResult = {
        sessionId,
        totalQuestions,
        correctAnswers,
        overallScore,
        categoryBreakdown: insertResult.categoryBreakdown,
        aiEfficiencyScore,
        completedAt: new Date()
      };

      console.log('Final validated result:', validatedResult);

      const result = await db.insert(quizResults)
        .values(validatedResult)
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error in createQuizResult:', error);
      console.error('Failed data:', insertResult);
      throw error;
    }
  }

  async getQuizResultsBySession(sessionId: number): Promise<QuizResult[]> {
    await this.initialize();
    return db.select().from(quizResults).where(eq(quizResults.sessionId, sessionId));
  }
}

// Instantiate and export the storage
export const storage = new DrizzleStorage();

// Helper function with sample data
function getSampleQuestions(): Omit<InsertQuestion, 'id'>[] {
  return [
    // General Questions
    {
      category: "General Questions",
      type: "text" as const,
      question: "Please provide your company website URL:",
      options: [],
      correctAnswer: "",
      explanation: "Understanding your business context",
      order: 1
    },
    {
      category: "General Questions",
      type: "multiple-choice" as const,
      question: "What is your primary industry?",
      options: ["Technology", "Healthcare", "Finance", "Manufacturing", "Retail", "Education", "Other"],
      correctAnswer: "Technology",
      explanation: "Industry context helps tailor AI recommendations",
      order: 2
    },
    {
      category: "General Questions",
      type: "multiple-choice" as const,
      question: "What is your company size?",
      options: ["1-10 employees", "11-50 employees", "51-200 employees", "201-1000 employees", "1000+ employees"],
      correctAnswer: "51-200 employees",
      explanation: "Company size affects AI implementation strategy",
      order: 3
    },
    {
      category: "General Questions",
      type: "multiple-choice" as const,
      question: "What is your role in the company?",
      options: ["CEO/Founder", "CTO/Tech Lead", "Operations Manager", "Marketing Manager", "HR Manager", "Other"],
      correctAnswer: "CEO/Founder",
      explanation: "Role affects AI priorities and implementation approach",
      order: 4
    },
    {
      category: "General Questions",
      type: "multiple-choice" as const,
      question: "What is your current annual revenue range?",
      options: ["Under $100K", "$100K-$500K", "$500K-$1M", "$1M-$5M", "$5M-$10M", "Over $10M"],
      correctAnswer: "$1M-$5M",
      explanation: "Revenue helps determine AI budget and ROI expectations",
      order: 5
    },

    // AI Adoption Questions
    {
      category: "AI Adoption",
      type: "multiple-choice" as const,
      question: "How would you rate your current AI adoption level?",
      options: ["No AI usage", "Exploring AI", "Limited AI use", "Moderate AI integration", "Advanced AI implementation"],
      correctAnswer: "Some integrated AI solutions",
      explanation: "Current adoption level determines next steps",
      order: 6
    },
    {
      category: "AI Adoption",
      type: "multiple-choice" as const,
      question: "What is your biggest challenge with AI implementation?",
      options: ["Lack of technical expertise", "High costs", "Data privacy concerns", "Integration complexity", "ROI uncertainty", "Employee resistance"],
      correctAnswer: "Integration complexity",
      explanation: "Understanding challenges helps provide targeted solutions",
      order: 7
    },
    {
      category: "AI Adoption",
      type: "multiple-choice" as const,
      question: "Which AI tools does your team currently use?",
      options: ["ChatGPT/Claude", "Automated customer service", "Data analytics AI", "Marketing automation", "HR automation", "None"],
      correctAnswer: "ChatGPT/Claude",
      explanation: "Current tools show AI readiness level",
      order: 8
    },
    {
      category: "AI Adoption",
      type: "multiple-choice" as const,
      question: "How do you measure AI success in your organization?",
      options: ["Time savings", "Cost reduction", "Revenue increase", "Customer satisfaction", "Employee productivity", "We don't measure it"],
      correctAnswer: "Time savings",
      explanation: "Success metrics guide AI strategy",
      order: 9
    },
    {
      category: "AI Adoption",
      type: "multiple-choice" as const,
      question: "What percentage of your workflows could benefit from AI automation?",
      options: ["0-20%", "21-40%", "41-60%", "61-80%", "81-100%"],
      correctAnswer: "41-60%",
      explanation: "Automation potential affects implementation priority",
      order: 10
    },

    // Operations Questions
    {
      category: "Operations",
      type: "multiple-choice" as const,
      question: "How do you currently handle customer support?",
      options: ["Manual email responses", "Phone support only", "Live chat", "Chatbot + human backup", "Fully automated AI system"],
      correctAnswer: "Live chat",
      explanation: "Support method shows automation opportunities",
      order: 11
    },
    {
      category: "Operations",
      type: "multiple-choice" as const,
      question: "What is your biggest operational bottleneck?",
      options: ["Data entry", "Customer communications", "Inventory management", "Report generation", "Scheduling", "Quality control"],
      correctAnswer: "Customer communications",
      explanation: "Bottlenecks are prime AI automation targets",
      order: 12
    },
    {
      category: "Operations",
      type: "multiple-choice" as const,
      question: "How much time does your team spend on repetitive tasks daily?",
      options: ["Less than 1 hour", "1-3 hours", "3-5 hours", "5-7 hours", "More than 7 hours"],
      correctAnswer: "3-5 hours",
      explanation: "Repetitive task time shows automation ROI potential",
      order: 13
    },
    {
      category: "Operations",
      type: "multiple-choice" as const,
      question: "What type of data does your company generate most?",
      options: ["Customer data", "Sales data", "Operational data", "Financial data", "Product data", "Marketing data"],
      correctAnswer: "Customer data",
      explanation: "Data type affects AI implementation strategy",
      order: 14
    },
    {
      category: "Operations",
      type: "multiple-choice" as const,
      question: "How do you currently analyze business performance?",
      options: ["Manual spreadsheets", "Basic dashboard tools", "Advanced analytics platforms", "AI-powered insights", "No formal analysis"],
      correctAnswer: "Basic dashboard tools",
      explanation: "Analysis method shows AI enhancement opportunities",
      order: 15
    },

    // Marketing Questions
    {
      category: "Marketing",
      type: "multiple-choice" as const,
      question: "How do you currently create marketing content?",
      options: ["Manual creation", "Templates and tools", "AI-assisted creation", "Fully automated AI", "Outsourced"],
      correctAnswer: "Templates and tools",
      explanation: "Content creation method shows AI integration potential",
      order: 16
    },
    {
      category: "Marketing",
      type: "multiple-choice" as const,
      question: "What is your biggest marketing challenge?",
      options: ["Lead generation", "Content creation", "Customer segmentation", "Campaign optimization", "ROI measurement", "Personalization"],
      correctAnswer: "Lead generation",
      explanation: "Marketing challenges guide AI solution priorities",
      order: 17
    },
    {
      category: "Marketing",
      type: "multiple-choice" as const,
      question: "How do you currently handle email marketing?",
      options: ["Manual individual emails", "Basic email campaigns", "Automated sequences", "AI-personalized campaigns", "No email marketing"],
      correctAnswer: "Automated sequences",
      explanation: "Email marketing sophistication shows AI readiness",
      order: 18
    },
    {
      category: "Marketing",
      type: "multiple-choice" as const,
      question: "What percentage of your marketing is data-driven?",
      options: ["0-20%", "21-40%", "41-60%", "61-80%", "81-100%"],
      correctAnswer: "41-60%",
      explanation: "Data-driven marketing shows AI implementation readiness",
      order: 19
    },
    {
      category: "Marketing",
      type: "multiple-choice" as const,
      question: "How do you currently track customer behavior?",
      options: ["No tracking", "Basic website analytics", "Advanced analytics", "AI-powered insights", "Predictive analytics"],
      correctAnswer: "Basic website analytics",
      explanation: "Tracking sophistication affects AI marketing potential",
      order: 20
    }
  ];
} 