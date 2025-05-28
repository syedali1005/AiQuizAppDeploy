import { useQuery, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, RotateCcw, Eye, X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { QuizResult } from '@shared/schema';

interface ResultsModalProps {
  sessionId: number;
  onClose: () => void;
  onNewAssessment: () => void;
}

export function ResultsModal({ sessionId, onClose, onNewAssessment }: ResultsModalProps) {
  const { data: results = [], isLoading } = useQuery<QuizResult[]>({
    queryKey: ['/api/quiz-results/session', sessionId],
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', `/api/quiz-results/${results[0]?.id}/export`, undefined);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Export initiated:', data);
      // In a real implementation, this would trigger a download
    },
  });

  const result = results[0];

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!result) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const categoryBreakdown = result.categoryBreakdown as Record<string, { correct: number; total: number }>;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Assessment Results
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="text-center py-8 bg-gradient-to-r from-green-50 to-green-25 rounded-lg">
            <div className={`text-4xl font-bold mb-2 ${getScoreColor(result.overallScore)}`}>
              {result.overallScore}%
            </div>
            <div className="text-lg text-gray-700 mb-1">Overall Score</div>
            <div className="text-sm text-gray-600 mb-4">
              {result.correctAnswers} of {result.totalQuestions} questions correct
            </div>
            <Badge variant={getScoreBadgeVariant(result.overallScore)}>
              {result.overallScore >= 80 ? 'Excellent' : 
               result.overallScore >= 60 ? 'Good' : 'Needs Improvement'}
            </Badge>
          </div>
          
          {/* Category Breakdown */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Category Performance</h3>
            
            {Object.entries(categoryBreakdown).map(([category, scores]) => {
              const percentage = Math.round((scores.correct / scores.total) * 100);
              const getCategoryIcon = (cat: string) => {
                switch (cat) {
                  case 'AI Ethics': return '🧠';
                  case 'Compliance': return '🛡️';
                  case 'Risk Management': return '⚠️';
                  case 'Implementation': return '⚙️';
                  default: return '📋';
                }
              };

              return (
                <div key={category} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                      percentage >= 80 ? 'bg-green-500' : 
                      percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                      <span className="text-xs">{getCategoryIcon(category)}</span>
                    </div>
                    <span className="font-medium text-gray-900">{category}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {scores.correct}/{scores.total} correct
                    </span>
                    <span className={`font-semibold ${getScoreColor(percentage)}`}>
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <Button variant="outline" className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Review Answers</span>
            </Button>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                className="flex items-center space-x-2"
                onClick={() => exportMutation.mutate()}
                disabled={exportMutation.isPending}
              >
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </Button>
              
              <Button 
                className="flex items-center space-x-2"
                onClick={onNewAssessment}
              >
                <RotateCcw className="w-4 h-4" />
                <span>New Assessment</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
