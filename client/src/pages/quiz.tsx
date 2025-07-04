import { useState, useEffect, useMemo } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { QuizHeader } from '@/components/quiz/quiz-header';
import { QuestionContent } from '@/components/quiz/question-content';
import { QuestionnaireView } from '@/components/quiz/questionnaire-view';
import { ResultsModal } from '@/components/quiz/results-modal';
import { AnswerReport } from '@/components/quiz/answer-report';
import { SolutionSuggestions } from '@/components/quiz/solution-suggestions';
import { useTimer } from '@/hooks/use-timer';
import { useToast } from '@/hooks/use-toast';
import type { Question, QuizSession } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';
import { ThankYouView } from "@/components/quiz/thank-you-view";
import { WelcomeCard, type UserDetails } from '@/components/quiz/welcome-card';

function shuffleArray<T>(array: T[]): T[] {
  // Fisher-Yates shuffle
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Quiz() {
  const [, navigate] = useLocation();
  const { sessionId } = useParams<{ sessionId?: string }>();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('questions');
  const [submittedSessionId, setSubmittedSessionId] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  const initialTime = 1800; // 30 minutes
  const { timeRemaining, isRunning, start: startTimer, pause: pauseTimer } = useTimer(
    initialTime,
    () => {
      toast({
        title: "Time's up!",
        description: "Your quiz will be automatically submitted.",
        variant: "destructive",
      });
      handleSubmitQuiz();
    }
  );

  // Fetch questions
  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ['questions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/questions');
      return response.json();
    },
  });

  // Prepare questions: 4 general + 6 shuffled department-specific
  const prepareQuestions = useMemo(() => {
    if (!questions.length) return [];

    // Always include first 4 questions (general + department selection)
    const generalQuestions = questions
      .filter(q => q.category === 'General Questions' || q.category === 'Department Focus')
      .sort((a, b) => a.order - b.order)
      .slice(0, 4);

    // Find department question (Q4)
    const departmentQuestion = generalQuestions.find(q =>
      q.category === 'Department Focus' &&
      q.question.includes('Which department(s) would benefit most from automation?')
    );

    // Get selected departments from answers
    const departmentAnswer = departmentQuestion ? answers[departmentQuestion.id.toString()] : '';
    let selectedDepartments: string[] = [];
    
    if (departmentAnswer) {
      try {
        // Handle both array and single string formats
        selectedDepartments = departmentAnswer.startsWith('[') 
          ? JSON.parse(departmentAnswer)
          : [departmentAnswer];
        
        // Clean up the department names
        selectedDepartments = selectedDepartments
          .map(dept => dept.replace('/Strategy', '').replace(' Department', '').trim())
          .filter(Boolean);
      } catch (error) {
        console.error('Error parsing department answer:', error);
        selectedDepartments = [];
      }
    }

    // Get department-specific questions
    let departmentQuestions: Question[] = [];
    if (selectedDepartments.length > 0) {
      // Create a stable sort key for each question based on its ID
      const stableSortKey = new Map(questions.map((q, idx) => [q.id, idx]));
      
      departmentQuestions = questions.filter(q =>
        selectedDepartments.some(dept => {
          const category = q.category.toLowerCase();
          const deptLower = dept.toLowerCase();
          return (
            category.includes(deptLower) ||
            category === deptLower ||
            category.startsWith(deptLower + ' ') ||
            category.startsWith(deptLower + '/')
          );
        }) &&
        !generalQuestions.some(gq => gq.id === q.id) // Exclude questions already in generalQuestions
      );

      // Sort by the stable sort key instead of random shuffle
      departmentQuestions.sort((a, b) => stableSortKey.get(a.id)! - stableSortKey.get(b.id)!);
    }

    // Fill up to 6 department questions
    let needed = 6 - departmentQuestions.length;
    let extraQuestions: Question[] = [];
    if (needed > 0) {
      const usedIds = new Set([...generalQuestions, ...departmentQuestions].map(q => q.id));
      extraQuestions = questions.filter(q =>
        !usedIds.has(q.id) &&
        q.category !== 'General Questions' &&
        q.category !== 'Department Focus'
      );
      
      // Use stable sort for extra questions too
      extraQuestions.sort((a, b) => a.id - b.id);
      extraQuestions = extraQuestions.slice(0, needed);
    }

    const finalQuestions = [...generalQuestions, ...departmentQuestions.slice(0, 6), ...extraQuestions].slice(0, 10);
    return finalQuestions;
  }, [questions, answers]);

  const currentQuestion = prepareQuestions[currentQuestionIndex];
  const totalQuestions = prepareQuestions.length;

  // Calculate answered questions for the current quiz
  const answeredQuestions = prepareQuestions.filter(q => answers[q.id.toString()] && answers[q.id.toString()].trim() !== '').length;

  // Check if all questions are answered
  const allAnswered = totalQuestions === 10 && Object.keys(answers).length === 10 && Object.values(answers).every(a => a && a.trim() !== '');

  // Fetch or create quiz session
  const { data: session } = useQuery<QuizSession>({
    queryKey: ['/api/quiz-sessions', sessionId],
    enabled: !!sessionId,
  });

  // Clear session storage when component mounts at root path
  useEffect(() => {
    if (!sessionId) {
      sessionStorage.removeItem('userDetails');
      setUserDetails(null);
    }
  }, [sessionId]);

  // Load user details from session storage
  useEffect(() => {
    const stored = sessionStorage.getItem('userDetails');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUserDetails(parsed);
      } catch (error) {
        console.error('Failed to parse stored user details:', error);
        sessionStorage.removeItem('userDetails');
      }
    }
  }, []);

  // Create session mutation (with user details)
  const createSessionMutation = useMutation({
    mutationFn: async (details: UserDetails) => {
      const response = await apiRequest("POST", "/api/quiz-sessions", {
        userName: details.name,
        companyName: details.companyName,
        email: details.email,
        contactNumber: details.contactNumber,
        answers: {},
        startTime: new Date().toISOString(),
        timeRemaining: initialTime,
        currentQuestionIndex: 0,
        isCompleted: false
      });
      return response.json();
    },
    onSuccess: (newSession) => {
      setSubmittedSessionId(newSession.id);
      navigate(`/quiz/${newSession.id}`);
      startTimer();
      toast({
        title: "Quiz Started",
        description: "Good luck with your assessment!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start the quiz. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to create session:", error);
    }
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

  // Submit quiz
  const submitQuizMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId && !submittedSessionId) throw new Error("No active session");
      const id = sessionId || submittedSessionId;
      
      setIsSubmittingQuiz(true);
      try {
        // First, PATCH answers to the session
        await apiRequest('PATCH', `/api/quiz-sessions/${id}`, { answers });
        
        // Then, POST to submit endpoint
        const response = await apiRequest("POST", `/api/quiz-sessions/${id}/submit`, {
          timeSpent: initialTime - timeRemaining,
        });
        return response.json();
      } finally {
        setIsSubmittingQuiz(false);
      }
    },
    onSuccess: (data) => {
      setSubmittedSessionId(data.sessionId);
      setShowResults(true);
      setIsSubmitted(true);
      setActiveTab("answers");
      setQuizSubmitted(true);
      toast({
        title: "Quiz Submitted",
        description: "Your assessment has been successfully submitted!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to submit quiz:", error);
    }
  });

  // Handle user details submission
  const handleUserDetailsSubmit = (details: UserDetails) => {
    setUserDetails(details);
    sessionStorage.setItem('userDetails', JSON.stringify(details));
    createSessionMutation.mutate(details);
  };

  // Load session data if available
  useEffect(() => {
    if (sessionId) {
      const loadSession = async () => {
        try {
          const response = await apiRequest('GET', `/api/quiz-sessions/${sessionId}`);
          const session = await response.json();
          setAnswers(session.answers as Record<string, string> || {});
          setCurrentQuestionIndex(session.currentQuestionIndex || 0);
          if (!isRunning && !session.isCompleted) {
            startTimer();
          }
        } catch (error) {
          console.error('Failed to load session:', error);
        }
      };
      loadSession();
    }
  }, [sessionId, isRunning]);

  // Update handleAnswerChange to properly handle department selection
  const handleAnswerChange = (questionId: number, answer: string) => {
    const questionIdStr = questionId.toString();
    setAnswers(prev => {
      const newAnswers = { ...prev, [questionIdStr]: answer };
      
      // If this is the department question, handle department-specific logic
      const question = questions.find(q => q.id === questionId);
      if (question?.category === "Department Focus") {
        let selectedDepts: string[] = [];
        try {
          selectedDepts = answer.startsWith('[') ? JSON.parse(answer) : [answer];
          selectedDepts = selectedDepts
            .map(dept => dept.replace('/Strategy', '').replace(' Department', '').trim())
            .filter(Boolean);
        } catch {
          selectedDepts = [];
        }

        // Clear answers for questions from non-selected departments
        Object.keys(prev).forEach(qId => {
          const q = questions.find(q => q.id.toString() === qId);
          if (q && q.category.includes("Department")) {
            const dept = q.category.split(" ")[0].toLowerCase();
            if (!selectedDepts.some(d => dept.includes(d.toLowerCase()))) {
              delete newAnswers[qId];
            }
          }
        });
      }
      
      return newAnswers;
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
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

  const handleSubmitQuiz = async () => {
    if (!allAnswered) {
      toast({
        title: "Cannot Submit",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmittingQuiz(true);
      const result = await submitQuizMutation.mutateAsync();
      setSubmittedSessionId(result.sessionId);
      setQuizSubmitted(true);
      setShowResults(true);
      
      // Show success toast
      toast({
        title: "Assessment Submitted Successfully",
        description: "Your results are ready to view",
      });
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      toast({
        title: "Submission Failed",
        description: "Please try again or contact support if the problem persists",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handlePauseResume = () => {
    if (isRunning) {
      pauseTimer();
      toast({
        title: "Quiz Paused",
        description: "Click resume when you're ready to continue",
      });
    } else {
      startTimer();
      toast({
        title: "Quiz Resumed",
        description: "Timer has started again",
      });
    }
  };

  // Calculate category progress
  const getCategoryProgress = () => {
    const categories: string[] = [];
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

  // Calculate current score
  const calculateCurrentScore = () => {
    const answered = Object.keys(answers).length;
    const correct = questions.reduce((acc: number, q: Question) => {
      const answer = answers[q.id.toString()];
      if (answer && q.correctAnswer && answer === q.correctAnswer) {
        return acc + 1;
      }
      return acc;
    }, 0);
    const percentage = Math.round((correct / questions.length) * 100);
    return { correct, answered, percentage };
  };

  const { correct: correctAnswers, percentage } = calculateCurrentScore();

  const getCategoryIcon = (category: string) => {
    return 'circle';
  };

  // Calculate progress percentage based on totalQuestions
  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Function to handle starting a new assessment
  const handleStartNewAssessment = () => {
    // Clear all state
    setCurrentQuestionIndex(0);
    setAnswers({});
    setFlaggedQuestions(new Set());
    setShowResults(false);
    setActiveTab('questions');
    setSubmittedSessionId(null);
    setIsSubmitted(false);
    setUserDetails(null);
    setQuizSubmitted(false);
    setIsSubmittingQuiz(false);
    
    // Clear session storage
    sessionStorage.removeItem('userDetails');
    
    // Navigate to root path instead of /quiz
    navigate('/');
    
    // Show toast
    toast({
      title: "Starting New Assessment",
      description: "Please enter your details to begin.",
    });
  };

  // Show welcome card if no session ID and no user details
  if (!sessionId && !userDetails) {
    return (
      <div className="container mx-auto px-4 py-8">
        <WelcomeCard onComplete={handleUserDetailsSubmit} />
      </div>
    );
  }

  // Show loading state while creating session
  if (createSessionMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your assessment...</p>
        </div>
      </div>
    );
  }

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

  // Show thank you page and results after submission
  if (quizSubmitted && submittedSessionId) {
    // Filter questions to only show ones that were answered
    const relevantQuestions = questions.filter(q => answers[q.id.toString()]);

    return (
      <div className="min-h-screen bg-background">
        <QuizHeader
          currentQuestion={totalQuestions}
          totalQuestions={totalQuestions}
          timeRemaining={timeRemaining.toString()}
          isRunning={false}
          onPauseResume={() => {}}
          category="Results"
          correctAnswers={correctAnswers}
          answeredQuestions={Object.keys(answers).length}
        />

        <main role="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="results" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="answers">Your Answers</TabsTrigger>
              </TabsList>

              <TabsContent value="results" className="space-y-8">
                <ThankYouView 
                  sessionId={submittedSessionId} 
                  onStartNew={handleStartNewAssessment} 
                />
                <ResultsModal
                  sessionId={submittedSessionId}
                  onClose={() => setShowResults(false)}
                  onNewAssessment={handleStartNewAssessment}
                />
              </TabsContent>

              <TabsContent value="answers">
                <Card className="animate-scale-in">
                  <CardHeader>
                    <CardTitle>Your Responses</CardTitle>
                    <CardDescription>
                      Review your answers for your department's assessment questions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AnswerReport
                      answers={answers}
                      questions={relevantQuestions}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <QuizHeader
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={totalQuestions}
        timeRemaining={timeRemaining.toString()}
        isRunning={isRunning}
        onPauseResume={handlePauseResume}
        category={currentQuestion?.category || ""}
        correctAnswers={correctAnswers}
        answeredQuestions={answeredQuestions}
      />

      <main role="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="answers">Your Answers</TabsTrigger>
          </TabsList>

          <TabsContent value="questions">
            <div className="space-y-6">
              <div className="quiz-card glow-effect animate-slide-in">
                <QuestionContent
                  question={currentQuestion}
                  answer={answers[currentQuestion.id.toString()] || ''}
                  onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
                  onNext={handleNextQuestion}
                  onPrevious={handlePreviousQuestion}
                  onFlag={() => handleFlagQuestion(currentQuestion.id)}
                  isFlagged={flaggedQuestions.has(currentQuestion.id)}
                  canGoNext={currentQuestionIndex < totalQuestions - 1}
                  canGoPrevious={currentQuestionIndex > 0}
                  isLastQuestion={currentQuestionIndex === totalQuestions - 1}
                  progressPercentage={(currentQuestionIndex / totalQuestions) * 100}
                />
              </div>
              <div className="flex justify-center mt-6">
                {currentQuestionIndex === totalQuestions - 1 && (
                  <Button 
                    onClick={handleSubmitQuiz} 
                    className="gradient-bg hover:scale-105 transition-all duration-300"
                    disabled={!allAnswered || isSubmittingQuiz}
                  >
                    {isSubmittingQuiz ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>
                    ) : (
                      'Submit Assessment'
                    )}
                  </Button>
                )}
              </div>
              <div className="max-w-4xl mx-auto mt-8">
                <SolutionSuggestions
                  category={currentQuestion.category}
                  questionType={currentQuestion.type}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="answers">
            <AnswerReport
              answers={answers}
              questions={questions}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
