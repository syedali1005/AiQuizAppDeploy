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

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Quiz Session methods
  createQuizSession(session: InsertQuizSession): Promise<QuizSession>;
  getQuizSession(id: number): Promise<QuizSession | undefined>;
  updateQuizSession(id: number, updates: Partial<QuizSession>): Promise<QuizSession | undefined>;
  
  // Question methods
  getAllQuestions(): Promise<Question[]>;
  getQuestionsByCategory(category: string): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  
  // Quiz Result methods
  createQuizResult(result: InsertQuizResult): Promise<QuizResult>;
  getQuizResultsBySession(sessionId: number): Promise<QuizResult[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private quizSessions: Map<number, QuizSession>;
  private questions: Map<number, Question>;
  private quizResults: Map<number, QuizResult>;
  private currentUserId: number;
  private currentSessionId: number;
  private currentQuestionId: number;
  private currentResultId: number;

  constructor() {
    this.users = new Map();
    this.quizSessions = new Map();
    this.questions = new Map();
    this.quizResults = new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
    this.currentQuestionId = 1;
    this.currentResultId = 1;
    
    // Initialize with sample questions
    this.initializeQuestions();
  }

  private initializeQuestions() {
    const sampleQuestions: InsertQuestion[] = [
      // AI Ethics
      {
        category: "AI Ethics",
        type: "multiple-choice",
        question: "Which of the following best describes the principle of fairness in AI systems used for hiring processes?",
        options: [
          "AI systems should treat all candidates identically regardless of protected characteristics",
          "AI systems should account for historical biases and actively work to mitigate discriminatory outcomes",
          "AI systems should prioritize efficiency over fairness considerations",
          "Fairness in AI is subjective and cannot be measured objectively"
        ],
        correctAnswer: "AI systems should account for historical biases and actively work to mitigate discriminatory outcomes",
        explanation: "Fairness in AI requires actively addressing historical biases and ensuring equitable outcomes for all groups.",
        order: 1
      },
      {
        category: "AI Ethics",
        type: "true-false",
        question: "Algorithmic transparency requires that all AI decision-making processes be fully explainable to end users.",
        options: ["True", "False"],
        correctAnswer: "True",
        explanation: "Transparency is a key principle in ethical AI, ensuring users understand how decisions affecting them are made.",
        order: 2
      },
      {
        category: "AI Ethics",
        type: "multiple-choice",
        question: "What is the primary concern with AI systems that exhibit bias?",
        options: [
          "They may be less efficient than unbiased systems",
          "They can perpetuate or amplify existing social inequalities",
          "They require more computational resources",
          "They are harder to maintain and update"
        ],
        correctAnswer: "They can perpetuate or amplify existing social inequalities",
        explanation: "Biased AI systems can reinforce and worsen existing societal disparities, making fairness a critical concern.",
        order: 3
      },
      
      // Compliance
      {
        category: "Compliance",
        type: "multiple-choice",
        question: "Under GDPR, what is required when using AI systems for automated decision-making that significantly affects individuals?",
        options: [
          "No special requirements apply",
          "Individuals must be informed and have the right to human review",
          "Only data minimization principles apply",
          "Consent is automatically assumed"
        ],
        correctAnswer: "Individuals must be informed and have the right to human review",
        explanation: "GDPR Article 22 requires transparency and the right to human intervention in automated decision-making.",
        order: 4
      },
      {
        category: "Compliance",
        type: "true-false",
        question: "AI systems used in healthcare must comply with HIPAA regulations in the United States.",
        options: ["True", "False"],
        correctAnswer: "True",
        explanation: "Healthcare AI systems must protect patient privacy and comply with HIPAA requirements.",
        order: 5
      },
      
      // Risk Management
      {
        category: "Risk Management",
        type: "multiple-choice",
        question: "What is the most effective approach to managing AI system risks?",
        options: [
          "Implement risks controls only after deployment",
          "Use a risk-by-design approach with continuous monitoring",
          "Rely solely on post-incident analysis",
          "Focus only on technical risks"
        ],
        correctAnswer: "Use a risk-by-design approach with continuous monitoring",
        explanation: "Proactive risk management from design through deployment with ongoing monitoring is most effective.",
        order: 6
      },
      {
        category: "Risk Management",
        type: "true-false",
        question: "AI systems should have rollback procedures in case of unexpected behavior.",
        options: ["True", "False"],
        correctAnswer: "True",
        explanation: "Rollback procedures are essential for quickly addressing AI system failures or unexpected behavior.",
        order: 7
      },
      
      // Implementation
      {
        category: "Implementation",
        type: "multiple-choice",
        question: "What is the recommended frequency for AI model retraining in production systems?",
        options: [
          "Never, once deployed models should remain static",
          "Only when major errors occur",
          "Based on data drift monitoring and performance metrics",
          "Exactly every 6 months regardless of performance"
        ],
        correctAnswer: "Based on data drift monitoring and performance metrics",
        explanation: "Retraining should be driven by monitoring data quality and model performance, not arbitrary schedules.",
        order: 8
      },
      {
        category: "Implementation",
        type: "true-false",
        question: "AI systems should include human oversight mechanisms in critical decision-making processes.",
        options: ["True", "False"],
        correctAnswer: "True",
        explanation: "Human oversight ensures accountability and provides a safety net for critical AI decisions.",
        order: 9
      }
    ];

    sampleQuestions.forEach(q => this.createQuestion(q));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Quiz Session methods
  async createQuizSession(insertSession: InsertQuizSession): Promise<QuizSession> {
    const id = this.currentSessionId++;
    const session: QuizSession = {
      ...insertSession,
      id,
      startTime: new Date(),
      endTime: null,
      currentQuestionIndex: 0,
      timeRemaining: 1800,
      answers: {},
      isCompleted: false,
      score: null,
      categoryScores: {}
    };
    this.quizSessions.set(id, session);
    return session;
  }

  async getQuizSession(id: number): Promise<QuizSession | undefined> {
    return this.quizSessions.get(id);
  }

  async updateQuizSession(id: number, updates: Partial<QuizSession>): Promise<QuizSession | undefined> {
    const session = this.quizSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates };
    this.quizSessions.set(id, updatedSession);
    return updatedSession;
  }

  // Question methods
  async getAllQuestions(): Promise<Question[]> {
    return Array.from(this.questions.values()).sort((a, b) => a.order - b.order);
  }

  async getQuestionsByCategory(category: string): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(q => q.category === category)
      .sort((a, b) => a.order - b.order);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.currentQuestionId++;
    const question: Question = { ...insertQuestion, id };
    this.questions.set(id, question);
    return question;
  }

  // Quiz Result methods
  async createQuizResult(insertResult: InsertQuizResult): Promise<QuizResult> {
    const id = this.currentResultId++;
    const result: QuizResult = {
      ...insertResult,
      id,
      completedAt: new Date()
    };
    this.quizResults.set(id, result);
    return result;
  }

  async getQuizResultsBySession(sessionId: number): Promise<QuizResult[]> {
    return Array.from(this.quizResults.values()).filter(r => r.sessionId === sessionId);
  }
}

export const storage = new MemStorage();
