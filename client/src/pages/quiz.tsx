import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { QuizHeader } from '@/components/quiz/quiz-header';
import { QuestionContent } from '@/components/quiz/question-content';
import { CategorySidebar } from '@/components/quiz/category-sidebar';
import { ResultsModal } from '@/components/quiz/results-modal';
import { useTimer } from '@/hooks/use-timer';
import { useToast } from '@/hooks/use-toast';
import type { Question, QuizSession } from '@shared/schema';

export default function Quiz() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [showResults, setShowResults] = useState(false);

  // Fetch questions
  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ['/api/questions'],
  });

  // Fetch or create quiz session
  const { data: session } = useQuery<QuizSession>({
    queryKey: ['/api/quiz-sessions', sessionId],
    enabled: !!sessionId,
  });

  // Timer setup
  const { timeRemaining, isRunning, start, pause, formatTime, setTimeRemaining } = useTimer(
    1800, // 30 minutes
    () => {
      toast({
        title: "Time's Up!",
        description: "The quiz has been automatically submitted.",
        variant: "destructive",
      });
      handleSubmitQuiz();
    }
  );

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/quiz-sessions', {
        userId: null, // For demo purposes
      });
      return response.json();
    },
    onSuccess: (newSession) => {
      setSessionId(newSession.id);
      start();
      toast({
        title: "Quiz Started",
        description: "Your assessment has begun. Good luck!",
      });
    },
  });

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async (updates: Partial<QuizSession>) => {
      const response = await apiRequest('PATCH', `/api/quiz-sessions/${sessionId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quiz-sessions', sessionId] });
    },
  });

  // Submit quiz mutation
  const submitQuizMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/quiz-sessions/${sessionId}/submit`, {});
      return response.json();
    },
    onSuccess: (result) => {
      setShowResults(true);
      toast({
        title: "Quiz Completed",
        description: `You scored ${result.overallScore}%!`,
      });
    },
  });

  // Initialize session on component mount
  useEffect(() => {
    if (!sessionId && questions.length > 0) {
      createSessionMutation.mutate();
    }
  }, [questions.length, sessionId]);

  // Auto-save progress
  useEffect(() => {
    if (sessionId && Object.keys(answers).length > 0) {
      const saveTimer = setTimeout(() => {
        updateSessionMutation.mutate({
          answers,
          currentQuestionIndex,
          timeRemaining,
        });
        
        toast({
          title: "Progress Saved",
          description: "Your answers have been automatically saved",
        });
      }, 2000);

      return () => clearTimeout(saveTimer);
    }
  }, [answers, currentQuestionIndex, timeRemaining, sessionId]);

  // Load existing session data
  useEffect(() => {
    if (session) {
      setAnswers(session.answers as Record<string, string> || {});
      setCurrentQuestionIndex(session.currentQuestionIndex);
      setTimeRemaining(session.timeRemaining);
      if (!isRunning && !session.isCompleted) {
        start();
      }
    }
  }, [session]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId.toString()]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleFlagQuestion = (questionId: number) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSubmitQuiz = () => {
    if (sessionId) {
      submitQuizMutation.mutate();
    }
  };

  const handlePauseResume = () => {
    if (isRunning) {
      pause();
      toast({
        title: "Quiz Paused",
        description: "Click resume when you're ready to continue",
      });
    } else {
      start();
      toast({
        title: "Quiz Resumed",
        description: "Timer has started again",
      });
    }
  };

  // Calculate category progress
  const getCategoryProgress = () => {
    const categories = ['AI Ethics', 'Compliance', 'Risk Management', 'Implementation'];
    return categories.map(category => {
      const categoryQuestions = questions.filter(q => q.category === category);
      const answered = categoryQuestions.filter(q => answers[q.id.toString()]).length;
      return {
        name: category,
        completed: answered,
        total: categoryQuestions.length,
        icon: getCategoryIcon(category)
      };
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'AI Ethics': return 'brain';
      case 'Compliance': return 'shield-alt';
      case 'Risk Management': return 'exclamation-triangle';
      case 'Implementation': return 'cogs';
      default: return 'circle';
    }
  };

  if (questionsLoading || createSessionMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No questions available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <QuizHeader
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        timeRemaining={formatTime}
        isRunning={isRunning}
        onPauseResume={handlePauseResume}
        category={currentQuestion.category}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="quiz-card glow-effect">
          <QuestionContent
            question={currentQuestion}
            answer={answers[currentQuestion.id.toString()] || ''}
            onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
            onNext={handleNextQuestion}
            onPrevious={handlePreviousQuestion}
            onFlag={() => handleFlagQuestion(currentQuestion.id)}
            isFlagged={flaggedQuestions.has(currentQuestion.id)}
            canGoNext={currentQuestionIndex < questions.length - 1}
            canGoPrevious={currentQuestionIndex > 0}
            isLastQuestion={currentQuestionIndex === questions.length - 1}
            progressPercentage={(currentQuestionIndex / questions.length) * 100}
          />
        </div>

        <CategorySidebar categories={getCategoryProgress()} />
      </main>

      {showResults && sessionId && (
        <ResultsModal
          sessionId={sessionId}
          onClose={() => setShowResults(false)}
          onNewAssessment={() => {
            setShowResults(false);
            navigate('/');
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
