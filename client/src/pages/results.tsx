import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, RotateCcw, Eye } from 'lucide-react';
import type { QuizResult, Question, QuizSession } from '@shared/schema';
import { AnswerReport } from '@/components/quiz/answer-report';

export default function Results() {
  const [match, params] = useRoute('/results/:sessionId');
  const sessionId = params?.sessionId ? parseInt(params.sessionId) : null;

  const { data: results = [], isLoading: isLoadingResults } = useQuery<QuizResult[]>({
    queryKey: ['/api/quiz-results/session', sessionId],
    enabled: !!sessionId,
  });

  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery<Question[]>({
    queryKey: ['/api/questions'],
  });

  const { data: session, isLoading: isLoadingSession } = useQuery<QuizSession>({
    queryKey: ['/api/quiz-sessions', sessionId],
  });

  const result = results[0]; // Get the latest result
  const isLoading = isLoadingResults || isLoadingQuestions || isLoadingSession;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!result || !session || !questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Results Not Found</h1>
              <p className="text-gray-600">The quiz results could not be found.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">AI</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Assessment Results</h1>
            </div>
            <div className="text-sm text-gray-600">
              Completed: {new Date(result.completedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Overall Score */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 bg-gradient-to-r from-green-50 to-green-25 rounded-lg">
                <div className={`text-4xl font-bold mb-2 ${getScoreColor(result.overallScore)}`}>
                  {result.overallScore}%
                </div>
                <div className="text-lg text-gray-700 mb-1">Overall Score</div>
                <div className="text-sm text-gray-600">
                  {result.correctAnswers} of {result.totalQuestions} questions correct
                </div>
                <Badge 
                  variant={getScoreBadgeVariant(result.overallScore)}
                  className="mt-4"
                >
                  {result.overallScore >= 80 ? 'Excellent' : 
                   result.overallScore >= 60 ? 'Good' : 'Needs Improvement'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Button variant="outline" className="flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>Review Answers</span>
                </Button>
                
                <div className="flex items-center space-x-3">
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Export PDF</span>
                  </Button>
                  
                  <Button 
                    className="flex items-center space-x-2"
                    onClick={() => window.location.href = '/'}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>New Assessment</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.overallScore < 80 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Areas for Improvement</h4>
                    <p className="text-sm text-yellow-700">
                      Focus on reviewing the questions you got wrong and understanding the correct answers.
                    </p>
                  </div>
                )}
                
                {result.overallScore >= 80 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Excellent Performance!</h4>
                    <p className="text-sm text-green-700">
                      You demonstrate strong understanding of the assessment topics. Consider sharing your knowledge with colleagues.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Answer Report */}
          <Card>
            <CardHeader>
              <CardTitle>Your Answers</CardTitle>
            </CardHeader>
            <CardContent>
              <AnswerReport
                answers={session.answers as Record<string, string>}
                questions={questions}
                onExport={() => {
                  console.log('Exporting results...');
                }}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
