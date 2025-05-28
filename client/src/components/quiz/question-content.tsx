import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Flag, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Question } from '@shared/schema';

interface QuestionContentProps {
  question: Question;
  answer: string;
  onAnswerChange: (answer: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onFlag: () => void;
  isFlagged: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isLastQuestion: boolean;
  progressPercentage: number;
}

export function QuestionContent({
  question,
  answer,
  onAnswerChange,
  onNext,
  onPrevious,
  onFlag,
  isFlagged,
  canGoNext,
  canGoPrevious,
  isLastQuestion
}: QuestionContentProps) {
  const renderQuestionInput = () => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <RadioGroup value={answer} onValueChange={onAnswerChange}>
            <div className="space-y-4">
              {(question.options as string[])?.map((option, index) => (
                <div key={index} className="quiz-option">
                  <RadioGroupItem 
                    value={option} 
                    id={`option-${index}`}
                    className="mt-1 text-primary"
                  />
                  <Label 
                    htmlFor={`option-${index}`}
                    className="text-gray-900 cursor-pointer flex-1"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );

      case 'true-false':
        return (
          <RadioGroup value={answer} onValueChange={onAnswerChange}>
            <div className="space-y-4">
              <div className="quiz-option">
                <RadioGroupItem 
                  value="True" 
                  id="true-option"
                  className="mt-1 text-primary"
                />
                <Label htmlFor="true-option" className="text-gray-900 cursor-pointer flex-1">
                  True
                </Label>
              </div>
              <div className="quiz-option">
                <RadioGroupItem 
                  value="False" 
                  id="false-option"
                  className="mt-1 text-primary"
                />
                <Label htmlFor="false-option" className="text-gray-900 cursor-pointer flex-1">
                  False
                </Label>
              </div>
            </div>
          </RadioGroup>
        );

      case 'short-answer':
        return (
          <Textarea
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Enter your answer here..."
            className="min-h-[120px] resize-none"
          />
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    if (question.type === 'short-answer') {
      return answer.trim().length > 0;
    }
    return answer !== '';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 leading-relaxed">
          {question.question}
        </h2>
        
        {renderQuestionInput()}
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <Button
          variant="ghost"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </Button>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            onClick={onFlag}
            className={`flex items-center space-x-2 ${
              isFlagged 
                ? 'text-orange-600 hover:text-orange-700' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Flag className={`w-4 h-4 ${isFlagged ? 'fill-current' : ''}`} />
            <span>Flag for Review</span>
          </Button>
          
          <Button
            onClick={onNext}
            disabled={!canProceed()}
            className="flex items-center space-x-2"
          >
            <span>{isLastQuestion ? 'Submit Quiz' : 'Next Question'}</span>
            {!isLastQuestion && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
