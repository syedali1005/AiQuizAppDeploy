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
} from "@shared/schema";
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
  constructor() {
    this.initializeQuestions();
    this.updateFirstQuestion();
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
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Quiz Session methods
  async createQuizSession(insertSession: InsertQuizSession): Promise<QuizSession> {
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
    const result = await db.select().from(quizSessions).where(eq(quizSessions.id, id));
    return result[0];
  }

  async updateQuizSession(id: number, updates: Partial<InsertQuizSession>): Promise<QuizSession | undefined> {
    const result = await db.update(quizSessions).set(updates).where(eq(quizSessions.id, id)).returning();
    return result[0];
  }

  // Question methods
  async getAllQuestions(): Promise<Question[]> {
    return db.select().from(questions).orderBy(asc(questions.order));
  }

  async getQuestionsByCategory(category: string): Promise<Question[]> {
    return db.select().from(questions).where(eq(questions.category, category)).orderBy(asc(questions.order));
  }

  // Quiz Result methods
  async createQuizResult(insertResult: InsertQuizResult): Promise<QuizResult> {
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
      order: 0
    },
    {
      category: "General Questions",
      type: "text" as const,
      question: "What are the top 3 repetitive or time-consuming tasks in your business right now?",
      options: [],
      correctAnswer: "",
      explanation: "Helps identify key automation opportunities",
      order: 1
    },
    {
      category: "General Questions",
      type: "multiple-choice" as const,
      question: "Have you used any AI tools or automation systems before?",
      options: [
        "Yes, extensively",
        "Yes, but only basic tools",
        "No, but interested",
        "No, not interested",
        "Other"
      ],
      correctAnswer: "",
      explanation: "Understanding previous automation experience",
      order: 2
    },
    // Department Selection
    {
      category: "Department Focus",
      type: "multiple-choice-multiple" as const,
      question: "Which department(s) would benefit most from automation?",
      options: [
        "Sales",
        "Marketing",
        "HR",
        "Operations",
        "Customer Support",
        "Finance",
        "Strategy/Leadership"
      ],
      correctAnswer: "",
      explanation: "Identifying priority areas for automation",
      order: 3
    },
    // Sales Department
    {
      category: "Sales Department",
      type: "multiple-choice",
      question: "How do you currently manage your sales leads?",
      options: [
        "Manual spreadsheets",
        "Basic CRM",
        "Advanced CRM with automation",
        "No formal system",
        "Other"
      ],
      correctAnswer: "",
      explanation: "Understanding sales process maturity",
      order: 4
    },
    {
      category: "Sales Department",
      type: "multiple-choice",
      question: "How are your follow-up emails handled?",
      options: [
        "Manual sending",
        "Basic email templates",
        "Automated sequences",
        "No systematic follow-up",
        "Other"
      ],
      correctAnswer: "",
      explanation: "Assessing email automation needs",
      order: 5
    },
    {
      category: "Sales Department",
      type: "multiple-choice",
      question: "Is your CRM automatically updated or done manually?",
      options: [
        "Fully manual updates",
        "Partially automated",
        "Fully automated",
        "No CRM system",
        "Other"
      ],
      correctAnswer: "",
      explanation: "Evaluating CRM automation level",
      order: 6
    },
    {
      category: "Sales Department",
      type: "text",
      question: "How do you track deals and pipeline progress?",
      options: [],
      correctAnswer: "",
      explanation: "Understanding pipeline management",
      order: 7
    },
    {
      category: "Sales Department",
      type: "multiple-choice",
      question: "Are meeting summaries or call notes being done manually?",
      options: [
        "Yes, fully manual",
        "Using templates",
        "AI-assisted summaries",
        "No systematic recording",
        "Other"
      ],
      correctAnswer: "",
      explanation: "Assessing meeting documentation process",
      order: 8
    },
    // Marketing Department
    {
      category: "Marketing Department",
      type: "text",
      question: "How do you currently plan and schedule content?",
      options: [],
      correctAnswer: "",
      explanation: "Understanding content management process",
      order: 9
    },
    {
      category: "Marketing Department",
      type: "multiple-choice",
      question: "Are you using AI for content creation?",
      options: [
        "Yes, extensively",
        "Sometimes for specific tasks",
        "No, but interested",
        "No, prefer human-only content",
        "Other"
      ],
      correctAnswer: "",
      explanation: "Assessing AI adoption in content creation",
      order: 10
    },
    {
      category: "Marketing Department",
      type: "multiple-choice",
      question: "How do you handle email marketing personalization?",
      options: [
        "No personalization",
        "Basic merge fields",
        "Behavior-based automation",
        "Advanced AI personalization",
        "Other"
      ],
      correctAnswer: "",
      explanation: "Understanding email marketing sophistication",
      order: 11
    },
    // HR Department
    {
      category: "HR Department",
      type: "multiple-choice",
      question: "How is your candidate sourcing handled?",
      options: [
        "Manual job board posting",
        "Basic ATS system",
        "AI-powered sourcing",
        "External recruiters",
        "Other"
      ],
      correctAnswer: "",
      explanation: "Evaluating recruitment automation",
      order: 12
    },
    {
      category: "HR Department",
      type: "multiple-choice",
      question: "How do you handle employee onboarding?",
      options: [
        "Manual process",
        "Checklist-based",
        "Automated workflow",
        "No formal process",
        "Other"
      ],
      correctAnswer: "",
      explanation: "Understanding onboarding efficiency",
      order: 13
    },
    // Operations Department
    {
      category: "Operations Department",
      type: "text",
      question: "What are your main recurring tasks in day-to-day ops?",
      options: [],
      correctAnswer: "",
      explanation: "Identifying automation opportunities",
      order: 14
    },
    {
      category: "Operations Department",
      type: "multiple-choice",
      question: "How do you track project progress?",
      options: [
        "Manual updates",
        "Project management tool",
        "Automated tracking system",
        "No systematic tracking",
        "Other"
      ],
      correctAnswer: "",
      explanation: "Assessing project management maturity",
      order: 15
    },
    // Customer Support
    {
      category: "Customer Support",
      type: "multiple-choice-multiple",
      question: "What support channels do you currently use?",
      options: [
        "Email",
        "Live Chat",
        "Phone",
        "Social Media",
        "Help Center",
        "Other"
      ],
      correctAnswer: "",
      explanation: "Understanding support infrastructure",
      order: 16
    },
    {
      category: "Customer Support",
      type: "multiple-choice",
      question: "Do you use AI-powered chatbots for support?",
      options: [
        "Yes, extensively",
        "Basic automation only",
        "No, but interested",
        "No, prefer human-only",
        "Other"
      ],
      correctAnswer: "",
      explanation: "Assessing AI adoption in support",
      order: 17
    },
    // Executive/Strategy
    {
      category: "Executive/Strategy",
      type: "multiple-choice",
      question: "How do you handle business intelligence and reporting?",
      options: [
        "Manual reports",
        "Basic BI tools",
        "Advanced analytics platform",
        "AI-powered insights",
        "Other"
      ],
      correctAnswer: "",
      explanation: "Understanding decision-making process",
      order: 18
    },
    {
      category: "Executive/Strategy",
      type: "text",
      question: "What metrics or dashboards do you check weekly?",
      options: [],
      correctAnswer: "",
      explanation: "Identifying key performance indicators",
      order: 19
    },
    // Finance Department
    {
      category: "Finance Department",
      type: "multiple-choice-multiple" as const,
      question: "Which of the following tasks take up the most time in your team? (Select all that apply)",
      options: [
        "Invoice generation & tracking",
        "Data entry and reconciliation",
        "Payroll processing",
        "Budgeting & forecasting",
        "Financial reporting",
        "Tax calculations and compliance",
        "Vendor payment management"
      ],
      correctAnswer: "",
      explanation: "Identifying time-consuming tasks in Finance",
      order: 20
    },
    {
      category: "Finance Department",
      type: "multiple-choice" as const,
      question: "How do you currently manage your accounting workflows?",
      options: [
        "Fully manual (Excel, paper, etc.)",
        "Semi-automated (using software but with manual checks)",
        "Mostly automated (only exceptions handled manually)",
        "Fully automated"
      ],
      correctAnswer: "",
      explanation: "Assessing current accounting workflow automation level",
      order: 21
    },
    {
      category: "Finance Department",
      type: "multiple-choice-multiple" as const,
      question: "What accounting software/tools do you use? (Select all that apply)",
      options: [
        "QuickBooks",
        "Xero",
        "Zoho Books",
        "Tally",
        "SAP",
        "Microsoft Excel",
        "Other (Please specify)"
      ],
      correctAnswer: "",
      explanation: "Identifying accounting software and tools in use",
      order: 22
    },
    {
      category: "Finance Department",
      type: "multiple-choice" as const,
      question: "How often do you face data mismatches or reconciliation issues?",
      options: [
        "Daily",
        "Weekly",
        "Monthly",
        "Rarely"
      ],
      correctAnswer: "",
      explanation: "Understanding data quality and reconciliation challenges",
      order: 23
    },
    {
      category: "Finance Department",
      type: "multiple-choice-multiple" as const,
      question: "Would you benefit from real-time dashboards for: (Select all that apply)",
      options: [
        "Cash flow analysis",
        "Profit & loss tracking",
        "Budget variance",
        "Department-wise expense breakdown",
        "All of the above"
      ],
      correctAnswer: "",
      explanation: "Assessing need for real-time financial insights",
      order: 24
    },
    {
      category: "Finance Department",
      type: "multiple-choice" as const,
      question: "Do you manually verify large transaction volumes or rely on automation?",
      options: [
        "Fully manual verification",
        "Rule-based automation (e.g., macros or filters)",
        "AI-assisted anomaly detection",
        "Not sure"
      ],
      correctAnswer: "",
      explanation: "Understanding transaction verification methods",
      order: 25
    },
    {
      category: "Finance Department",
      type: "multiple-choice-multiple" as const,
      question: "Are you currently using or exploring AI tools for: (Select all that apply)",
      options: [
        "Fraud detection",
        "Predictive cash flow",
        "Automated reconciliation",
        "AI financial assistant/chatbot",
        "None"
      ],
      correctAnswer: "",
      explanation: "Assessing current or potential AI tool usage in Finance",
      order: 26
    },
    {
      category: "Finance Department",
      type: "multiple-choice" as const,
      question: "If AI could save you 50%+ time in repetitive tasks, how likely are you to adopt it?",
      options: [
        "Very likely",
        "Somewhat likely",
        "Neutral",
        "Not interested"
      ],
      correctAnswer: "",
      explanation: "Gauging willingness to adopt AI for efficiency gains",
      order: 27
    },
    {
      category: "Finance Department",
      type: "multiple-choice" as const,
      question: "What is your biggest challenge in automating your finance operations?",
      options: [
        "Budget constraints",
        "Lack of technical know-how",
        "Data privacy/security concerns",
        "Integration with existing systems",
        "Other (please specify)"
      ],
      correctAnswer: "",
      explanation: "Identifying barriers to finance automation",
      order: 28
    },
    {
      category: "Finance Department",
      type: "multiple-choice" as const,
      question: "Would you like a free consultation to identify automation opportunities in your finance department?",
      options: [
        "Yes",
        "No",
        "Maybe, send more info"
      ],
      correctAnswer: "",
      explanation: "Offering a consultation for automation opportunities",
      order: 29
    }
  ];
}
