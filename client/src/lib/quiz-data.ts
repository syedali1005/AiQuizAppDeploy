// This file contains the quiz data structure and utilities
// In a real application, this would likely come from a database

export interface QuizCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const QUIZ_CATEGORIES: QuizCategory[] = [
  {
    id: 'ai-ethics',
    name: 'AI Ethics',
    icon: 'brain',
    description: 'Principles of ethical AI development and deployment'
  },
  {
    id: 'compliance',
    name: 'Compliance',
    icon: 'shield-alt',
    description: 'Regulatory compliance and legal requirements'
  },
  {
    id: 'risk-management',
    name: 'Risk Management',
    icon: 'exclamation-triangle',
    description: 'Identifying and mitigating AI-related risks'
  },
  {
    id: 'implementation',
    name: 'Implementation',
    icon: 'cogs',
    description: 'Best practices for AI system implementation'
  }
];

export const QUIZ_SETTINGS = {
  DURATION_MINUTES: 30,
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  MIN_SCORE_PASS: 60,
  EXCELLENT_SCORE: 80
};

export function calculateGrade(score: number): string {
  if (score >= QUIZ_SETTINGS.EXCELLENT_SCORE) return 'Excellent';
  if (score >= QUIZ_SETTINGS.MIN_SCORE_PASS) return 'Good';
  return 'Needs Improvement';
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
