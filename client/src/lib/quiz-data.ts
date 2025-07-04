// This file contains the quiz data structure and utilities
// In a real application, this would likely come from a database

export interface QuizCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const QUIZ_CATEGORIES: QuizCategory[] = [];

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
