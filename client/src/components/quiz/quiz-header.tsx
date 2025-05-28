import { Clock, Pause, Play, Brain, Sparkles } from 'lucide-react';
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
    <header className="gradient-header shadow-2xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 floating-element">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white">AI Audit Assessment</h1>
              <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-white/80 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
              <span className="font-medium">Assessment Session</span> | 
              <span className="ml-1">{new Date().toLocaleDateString()}</span>
            </div>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <span className="sr-only">Export Results</span>
              📥
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-black/20 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                <span className="text-sm font-semibold text-white">
                  Question {currentQuestion} of {totalQuestions}
                </span>
              </div>
              <Badge variant="secondary" className="bg-primary/20 text-primary-foreground border-primary/30 px-3 py-1">
                {category}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-white bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm">
                <Clock className="w-4 h-4 text-blue-300" />
                <span className="font-mono font-medium">{timeRemaining}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onPauseResume}
                className="text-orange-300 hover:text-orange-200 hover:bg-white/10 border border-white/20"
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            <Progress value={progressPercentage} className="h-3 bg-white/20" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-green-300">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Progress auto-saved</span>
              </div>
              <div className="text-xs text-white/60">
                {Math.round(progressPercentage)}% Complete
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
