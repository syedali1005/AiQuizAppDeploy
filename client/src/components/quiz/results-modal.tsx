import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, RotateCcw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { QuizResult, Question, QuizSession } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface ResultsModalProps {
  sessionId: number;
  onClose: () => void;
  onNewAssessment: () => void;
}

export function ResultsModal({ sessionId, onClose, onNewAssessment }: ResultsModalProps) {
  const { data: results = [], isLoading: isLoadingResults, error: resultsError } = useQuery<QuizResult[]>({
    queryKey: ['/api/quiz-results/session', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/quiz-results/session/${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
      const data = await response.json();
      console.log('Fetched results:', data); // Debug log
      return data;
    },
    enabled: !!sessionId,
    refetchInterval: 1000,
    retry: 3,
    retryDelay: 1000,
  });

  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery<Question[]>({
    queryKey: ['/api/questions'],
  });

  const { data: session, isLoading: isLoadingSession } = useQuery<QuizSession>({
    queryKey: ['/api/quiz-sessions', sessionId],
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      if (!results.length) throw new Error('No results available');
      const response = await fetch(`/api/quiz-results/${results[0].id}/export`);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Export initiated:', data);
    },
  });

  console.log('Current results:', results); // Debug log
  const result = results[0];
  const isLoading = isLoadingResults || isLoadingQuestions || isLoadingSession;

  if (isLoading || !result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Loading Results</CardTitle>
          <CardDescription>
            {resultsError 
              ? "Error loading results. Please try again." 
              : "Please wait while we calculate your results..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          {resultsError && (
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!session) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Assessment Results</CardTitle>
          <CardDescription>
            Here's how you performed in the assessment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Overall Score</h3>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <motion.span 
                      className={`text-4xl font-bold ${getScoreColor(result.overallScore)}`}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      {result.overallScore}%
                    </motion.span>
                    <motion.div 
                      className="absolute -inset-4 bg-primary/10 rounded-full -z-10"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    />
                  </div>
                  <Badge variant={getScoreBadgeVariant(result.overallScore)}>
                    {result.correctAnswers} / {result.totalQuestions} correct
                  </Badge>
                </div>
              </div>
              <div className="space-x-2">
                <Button variant="outline" onClick={onNewAssessment}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New Assessment
                </Button>
                <Button onClick={() => exportMutation.mutate()}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Results
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
              <div className="space-y-4">
                {Object.entries(result.categoryBreakdown as Record<string, { correct: number; total: number }>)
                  .filter(([_, scores]) => scores.total > 0)
                  .map(([category, scores], index) => {
                    const percentage = Math.round((scores.correct / scores.total) * 100);
                    return (
                      <motion.div 
                        key={category} 
                        className="space-y-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">{category}</span>
                          <span className={getScoreColor(percentage)}>{percentage}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </motion.div>
                    );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
