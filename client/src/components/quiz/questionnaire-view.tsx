import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flag, Send, CheckCircle, Plus, Globe, Info, XCircle, Clipboard } from 'lucide-react';
import type { Question } from '@shared/schema';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VoiceInput } from './voice-input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageCircle, Bot, User } from 'lucide-react';
import { ThankYouView } from './thank-you-view';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

interface QuestionnaireViewProps {
  questions: Question[];
  answers: Record<string, string>;
  onAnswerChange: (questionId: number, answer: string) => void;
  onSubmit: () => Promise<{ sessionId: number }>;
  onFlag: (questionId: number) => void;
  flaggedQuestions: Set<number>;
}

interface Message {
  id: string;
  content: string;
  isAgent: boolean;
  timestamp: Date;
}

export function QuestionnaireView({
  questions,
  answers,
  onAnswerChange,
  onSubmit,
  onFlag,
  flaggedQuestions
}: QuestionnaireViewProps) {
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  // Find the department selection question (Q4)
  const departmentQuestion = questions.find(q => 
    q.category === "Department Focus" && 
    q.question.includes("Which department(s) would benefit most from automation?")
  );

  // Update selected departments when the department question is answered
  useEffect(() => {
    if (departmentQuestion) {
      const answer = answers[departmentQuestion.id.toString()];
      if (answer) {
        try {
          const departments = JSON.parse(answer);
          setSelectedDepartments(departments);
        } catch {
          setSelectedDepartments([answer]);
        }
      }
    }
  }, [answers, departmentQuestion]);

  // Filter questions based on selected departments
  const filteredQuestions = questions.filter(question => {
    // Always show general questions and department selection
    if (question.category === "General Questions" || question.category === "Department Focus") {
      return true;
    }

    // If no departments selected yet, don't show department-specific questions
    if (selectedDepartments.length === 0) {
      return false;
    }

    // Show questions for selected departments
    return selectedDepartments.some(dept => 
      question.category === `${dept} Department` || 
      question.category === dept || 
      question.category === `${dept}/Strategy`
    );
  });

  // Sort questions to ensure proper order
  const sortedQuestions = [...filteredQuestions].sort((a, b) => a.order - b.order);

  useEffect(() => {
    // Initialize selected options and other texts based on current answers
    const newSelectedOptions: Record<string, string> = {};
    const newOtherTexts: Record<string, string> = {};

    sortedQuestions.forEach(question => {
      const answer = answers[question.id.toString()];
      if (answer) {
        if (answer.startsWith("Other: ")) {
          newOtherTexts[question.id.toString()] = answer.substring(7);
          newSelectedOptions[question.id.toString()] = "Other";
        } else {
          newSelectedOptions[question.id.toString()] = answer;
          newOtherTexts[question.id.toString()] = "";
        }
      }
    });

    setSelectedOptions(newSelectedOptions);
    setOtherTexts(newOtherTexts);
  }, [answers, sortedQuestions]);

  const handleOptionChange = (questionId: number, value: string) => {
    const questionIdStr = questionId.toString();
    const newSelectedOptions = { ...selectedOptions, [questionIdStr]: value };
    setSelectedOptions(newSelectedOptions);
    
    // Special handling for department selection question
    if (departmentQuestion && questionId === departmentQuestion.id) {
      // For department selection, maintain an array of selections
      const currentSelections = answers[questionIdStr] ? 
        (typeof answers[questionIdStr] === 'string' ? 
          JSON.parse(answers[questionIdStr]) : 
          answers[questionIdStr]
        ) : [];
      
      const newSelections = currentSelections.includes(value) ?
        currentSelections.filter((s: string) => s !== value) :
        [...currentSelections, value];
      
      onAnswerChange(questionId, JSON.stringify(newSelections));
      setSelectedDepartments(newSelections);
    } else {
      // Normal question handling
      if (value === "Other") {
        const otherText = otherTexts[questionIdStr] || "";
        onAnswerChange(questionId, `Other: ${otherText}`);
      } else {
        onAnswerChange(questionId, value);
      }
    }
  };

  const handleOtherTextChange = (questionId: number, text: string) => {
    const questionIdStr = questionId.toString();
    const newOtherTexts = { ...otherTexts, [questionIdStr]: text };
    setOtherTexts(newOtherTexts);
    onAnswerChange(questionId, `Other: ${text}`);
  };

  const handleVoiceInput = (questionId: number, text: string, question: Question) => {
    if (question.type === 'text') {
      onAnswerChange(questionId, text);
    } else if (question.type === 'multiple-choice' || question.type === 'multiple-choice-multiple') {
      const options = question.options as string[];
      const matchedOption = options.find(
        (option: string) => option.toLowerCase() === text.toLowerCase()
      );
      if (matchedOption) {
        handleOptionChange(questionId, matchedOption);
      } else {
        handleOptionChange(questionId, 'Other');
        handleOtherTextChange(questionId, text);
      }
    }
  };

  const renderQuestionInput = (question: Question) => {
    const questionIdStr = question.id.toString();
    const selectedOption = selectedOptions[questionIdStr] || "";
    const otherText = otherTexts[questionIdStr] || "";
    const answer = answers[questionIdStr] || "";

    // Special handling for department selection question
    if (departmentQuestion && question.id === departmentQuestion.id) {
      return (
        <div className="space-y-3">
          {(question.options as string[]).map((option, index) => (
            <motion.div 
              key={index} 
              className="quiz-option group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="relative flex items-center p-3 rounded-lg border border-primary/20 hover:border-primary/40 bg-background/50 backdrop-blur-sm transition-all duration-200 group-hover:shadow-md">
                <input
                  type="checkbox"
                  id={`option-${question.id}-${index}`}
                  checked={selectedDepartments.includes(option)}
                  onChange={() => handleOptionChange(question.id, option)}
                  className="text-primary border-primary/30"
                />
                <Label 
                  htmlFor={`option-${question.id}-${index}`}
                  className="text-foreground cursor-pointer flex-1 font-medium text-sm leading-relaxed ml-3"
                >
                  {option}
                </Label>
              </div>
            </motion.div>
          ))}
        </div>
      );
    }

    // Regular question handling
    switch (question.type) {
      case 'multiple-choice':
      case 'multiple-choice-multiple':
        const options = question.options as string[];
        const hasOther = options.includes("Other");
        // Don't add "Other" option for department question
        const shouldAddOther = !hasOther && question.id !== departmentQuestion?.id;
        return (
          <RadioGroup 
            value={selectedOption} 
            onValueChange={(value) => handleOptionChange(question.id, value)}
          >
            <div className="space-y-3">
              {[...options, ...(shouldAddOther ? ["Other"] : [])].map((option, index) => (
                <motion.div 
                  key={index} 
                  className="quiz-option group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="relative flex items-center p-3 rounded-lg border border-primary/20 hover:border-primary/40 bg-background/50 backdrop-blur-sm transition-all duration-200 group-hover:shadow-md">
                    <RadioGroupItem 
                      value={option} 
                      id={`option-${question.id}-${index}`}
                      className="text-primary border-primary/30"
                    />
                    <Label 
                      htmlFor={`option-${question.id}-${index}`}
                      className="text-foreground cursor-pointer flex-1 font-medium text-sm leading-relaxed ml-3"
                    >
                      {option}
                    </Label>
                    {option === "Other" && (
                      <Plus className="w-4 h-4 text-primary/50 group-hover:text-primary transition-colors duration-200" />
                    )}
                  </div>
                  <AnimatePresence>
                    {selectedOption === "Other" && option === "Other" && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-8 mt-2 p-3 rounded-lg border border-primary/20 bg-background/30 backdrop-blur-sm">
                          <Textarea
                            value={otherText}
                            onChange={(e) => handleOtherTextChange(question.id, e.target.value)}
                            placeholder="Please specify your answer..."
                            className="min-h-[80px] resize-none bg-background/50 border-primary/30 focus:border-primary transition-colors duration-200 text-sm"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </RadioGroup>
        );

      case 'text':
        // Special handling for website URL question
        if (question.question.toLowerCase().includes("website url")) {
          const isValidUrl = /^https?:\/\//.test(answer) && answer.length > 10;
          return (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-primary">Company Website URL</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" tabIndex={-1}><Info className="w-4 h-4 text-primary/60 hover:text-primary" /></button>
                  </PopoverTrigger>
                  <PopoverContent className="text-xs max-w-xs">We use your website to better understand your business context. Your URL is kept private and only used for assessment purposes.</PopoverContent>
                </Popover>
              </div>
              <div className="relative flex items-center">
                <Input
                  type="url"
                  value={answer}
                  onChange={(e) => onAnswerChange(question.id, e.target.value)}
                  placeholder="e.g., https://www.yourcompany.com"
                  className={
                    `bg-background/60 border-2 focus:border-primary/70 transition-colors duration-200 rounded-xl p-3 text-base pr-16 shadow-md ${isValidUrl ? 'border-green-400' : answer ? 'border-destructive' : 'border-primary/20'}`
                  }
                  autoComplete="url"
                />
                <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  <Globe className="w-5 h-5" />
                </div>
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary/70 hover:text-primary focus:outline-none"
                  onClick={async () => {
                    const text = await navigator.clipboard.readText();
                    onAnswerChange(question.id, text);
                  }}
                  aria-label="Paste from clipboard"
                >
                  <Clipboard className="w-4 h-4" />
                </button>
                {answer && (
                  isValidUrl ? (
                    <CheckCircle className="absolute left-2 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
                  ) : (
                    <XCircle className="absolute left-2 top-1/2 transform -translate-y-1/2 text-destructive w-5 h-5" />
                  )
                )}
              </div>
              <p className="text-xs text-muted-foreground ml-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Please include the full URL starting with http:// or https:// <span className="text-primary font-medium">(e.g., https://www.yourcompany.com)</span>
              </p>
              <p className="text-xs text-green-700 mt-1">Your website is only used to personalize your assessment and is never shared.</p>
            </div>
          );
        }
        
        // Enhanced open-ended/text question (not website URL)
        const minItems = 3;
        const items = answer.split(/[,\n;]/).map(s => s.trim()).filter(Boolean);
        const isValid = items.length >= minItems;
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-primary">Your Answer</span>
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" tabIndex={-1}><Info className="w-4 h-4 text-primary/60 hover:text-primary" /></button>
                </PopoverTrigger>
                <PopoverContent className="text-xs max-w-xs">List the top 3+ repetitive or time-consuming tasks. This helps us identify automation opportunities tailored to your business.</PopoverContent>
              </Popover>
            </div>
            <div className="relative">
            <Textarea
              value={answer}
              onChange={(e) => onAnswerChange(question.id, e.target.value)}
                placeholder="e.g., Data entry, Invoice processing, Manual reporting"
                className={`min-h-[100px] resize-none bg-background/60 border-2 focus:border-primary/70 transition-colors duration-200 rounded-xl p-4 text-base pr-16 shadow-md ${isValid ? 'border-green-400' : answer ? 'border-destructive' : 'border-primary/20'}`}
                autoComplete="off"
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-primary/70 hover:text-primary focus:outline-none"
                onClick={async () => {
                  const text = await navigator.clipboard.readText();
                  onAnswerChange(question.id, text);
                }}
                aria-label="Paste from clipboard"
              >
                <Clipboard className="w-4 h-4" />
              </button>
              {answer && (
                isValid ? (
                  <CheckCircle className="absolute left-3 top-3 text-green-500 w-5 h-5" />
                ) : (
                  <XCircle className="absolute left-3 top-3 text-destructive w-5 h-5" />
                )
              )}
              <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                {answer.length}/500
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground ml-1">
              <Info className="w-3 h-3" />
              Recommended: List at least 3 items, separated by commas or new lines.
            </div>
            <div className="flex items-center justify-center mt-2">
              <VoiceInput 
                onResult={(text) => onAnswerChange(question.id, text)} 
                placeholder="Click to speak your answer..."
              />
            </div>
            <p className="text-xs text-green-700 mt-1">Your answer is only used to personalize your assessment and is never shared.</p>
          </div>
        );

      default:
        return null;
    }
  };

  const isQuestionAnswered = (question: Question) => {
    const answer = answers[question.id.toString()];
    if (!answer) return false;
    
    // Special handling for department selection question
    if (departmentQuestion && question.id === departmentQuestion.id) {
      try {
        const selectedDepts = JSON.parse(answer);
        return Array.isArray(selectedDepts) && selectedDepts.length > 0;
      } catch {
        return false;
      }
    }
    
    // Regular question handling
    if (question.type === 'text') {
      return answer.trim().length > 0;
    }
    
    const selectedOption = selectedOptions[question.id.toString()];
    if (selectedOption === "Other") {
      const otherText = otherTexts[question.id.toString()];
      return otherText && otherText.trim().length > 0;
    }
    
    return answer !== '';
  };

  const answeredCount = sortedQuestions.filter(q => isQuestionAnswered(q)).length;
  const canSubmit = answeredCount === sortedQuestions.length;

  const handleSubmitWithAnimation = async () => {
    setIsSubmitting(true);
    try {
      const result = await onSubmit();
      // Store the session ID from the submission result
      if (result?.sessionId) {
        setCurrentSessionId(result.sessionId);
      }
      // Artificial delay for smooth animation
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsSubmitted(true);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartNew = () => {
    window.location.reload();
  };

  if (isSubmitted && currentSessionId) {
    return <ThankYouView sessionId={currentSessionId} onStartNew={handleStartNew} />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Progress Header */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl font-bold">Assessment Questionnaire</span>
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Progress: {answeredCount} of {sortedQuestions.length} questions completed
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Questions */}
      <AnimatePresence>
        {!isSubmitting && (
          <motion.div 
            className="space-y-6"
            exit={{ opacity: 0, y: 20 }}
          >
            {sortedQuestions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`relative transition-all duration-300 ${
                  isQuestionAnswered(question) 
                    ? 'border-green-200 bg-green-50/50' 
                    : 'border-primary/20 hover:border-primary/40'
                }`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                          isQuestionAnswered(question)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-primary/20 text-primary'
                        }`}>
                          {isQuestionAnswered(question) ? <CheckCircle className="w-4 h-4" /> : index + 1}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-foreground leading-relaxed">
                            {question.question}
                          </CardTitle>
                          {question.category && (
                            <div className="mt-2">
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                {question.category}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onFlag(question.id)}
                        className={`flex items-center space-x-1 transition-all duration-200 ${
                          flaggedQuestions.has(question.id)
                            ? 'text-orange-400 hover:text-orange-300'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Flag className={`w-4 h-4 ${flaggedQuestions.has(question.id) ? 'fill-current' : ''}`} />
                        <span className="text-xs">Flag</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {renderQuestionInput(question)}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Section */}
      <motion.div 
        className="sticky bottom-6 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {canSubmit ? (
                  <span className="text-green-600 font-medium">✓ All questions answered</span>
                ) : (
                  <span>Complete all questions to submit ({sortedQuestions.length - answeredCount} remaining)</span>
                )}
              </div>
              <Button
                onClick={handleSubmitWithAnimation}
                disabled={!canSubmit || isSubmitting}
                className="flex items-center space-x-2 gradient-bg hover:scale-105 transition-all duration-300 shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Assessment</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 