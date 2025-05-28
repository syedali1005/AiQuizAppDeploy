import { Clock, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface QuizHeaderProps {
  currentQuestion: number;
  totalQuestions: number;
  timeRemaining: string;
  isRunning: boolean;
  onPauseResume: () => void;
  category: string;
}

export function QuizHeader({
  currentQuestion,
  totalQuestions,
  timeRemaining,
  isRunning,
  onPauseResume,
  category
}: QuizHeaderProps) {
  const progressPercentage = (currentQuestion / totalQuestions) * 100;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">AI Audit Assessment</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span>John Auditor</span> | 
              <span className="ml-1">{new Date().toLocaleDateString()}</span>
            </div>
            <Button variant="ghost" size="sm">
              <span className="sr-only">Export Results</span>
              📥
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-600">
                Question {currentQuestion} of {totalQuestions}
              </span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {category}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{timeRemaining}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onPauseResume}
                className="text-orange-600 hover:text-orange-700"
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          <Progress value={progressPercentage} className="h-2 mb-2" />
          
          <div className="flex items-center justify-end">
            <div className="flex items-center space-x-2 text-xs text-green-600">
              <span>✓</span>
              <span>Progress auto-saved</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
