import { Clock, Pause, Play, Brain, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SparkAILogo } from '@/components/ui/logo';
import { AgentChat } from './agent-chat';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';

interface QuizHeaderProps {
  currentQuestion: number;
  totalQuestions: number;
  timeRemaining: string;
  isRunning: boolean;
  onPauseResume: () => void;
  category: string;
  correctAnswers?: number;
  answeredQuestions?: number;
}

export function QuizHeader({
  currentQuestion,
  totalQuestions,
  timeRemaining,
  isRunning,
  onPauseResume,
  category,
  correctAnswers = 0,
  answeredQuestions = 0
}: QuizHeaderProps) {
  const progressPercentage = (currentQuestion / totalQuestions) * 100;

  const formatTime = (timeStr: string) => {
    // Convert the time string to a number
    const totalSeconds = parseInt(timeStr, 10);
    if (isNaN(totalSeconds)) return "00:00";
    
    // Calculate minutes and seconds
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    // Pad with zeros if needed
    const paddedMinutes = minutes.toString().padStart(2, '0');
    const paddedSeconds = seconds.toString().padStart(2, '0');
    
    return `${paddedMinutes}:${paddedSeconds}`;
  };

  return (
    <header className="gradient-header shadow-2xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <SparkAILogo className="h-10 w-auto floating-element" />
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white">AI Audit Assessment</h1>
                <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Assessment Session Info */}
            <div className="flex items-center">
              <div className="text-sm text-white/80 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                <span className="font-medium">Assessment Session</span> | 
                <span className="ml-1">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <AgentChat />
              <ThemeSwitcher />
            </div>
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
              <div className="flex items-center space-x-2 text-sm text-white bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm animate-pulse-glow">
                <Clock className="w-4 h-4 text-blue-300 animate-spin" style={{animationDuration: '8s'}} />
                <span className="font-mono font-medium animate-shimmer">{formatTime(timeRemaining)}</span>
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
            <div className="relative">
              <Progress value={progressPercentage} className="h-3 bg-white/20" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-full animate-shimmer opacity-50"></div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-green-300 animate-bounce-in">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Progress auto-saved</span>
              </div>
              <div className="text-xs text-white/60 animate-scale-in">
                {Math.round(progressPercentage)}% Complete
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
