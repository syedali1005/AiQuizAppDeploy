import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { VoiceInput } from './voice-input';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Question {
  id: number;
  type: string;
  question: string;
  options: string[];
}

interface QuestionCardProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}

export function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string>(value);
  const [textValue, setTextValue] = useState<string>(value);
  const [selectedValues, setSelectedValues] = useState<string[]>(() => {
    try {
      return value ? JSON.parse(value) : [];
    } catch {
      return [];
    }
  });
  const [otherText, setOtherText] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);

  // Sync internal state with external value
  useEffect(() => {
    setSelectedOption(value);
    setTextValue(value);
    try {
      setSelectedValues(value ? JSON.parse(value) : []);
    } catch {
      // If value is not JSON, assume it's a single value
      setSelectedValues(value ? [value] : []);
    }
  }, [value]);

  const handleVoiceInput = (text: string) => {
    setTextValue(text);
    onChange(text);
  };

  const handleOptionChange = (newValue: string) => {
    setSelectedOption(newValue);
    onChange(newValue);
  };

  const handleMultipleChoiceChange = (values: string[]) => {
    setSelectedValues(values);
    onChange(JSON.stringify(values));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setTextValue(text);
    onChange(text);
  };

  const renderInput = () => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <RadioGroup
            value={selectedOption}
            onValueChange={handleOptionChange}
            className="space-y-3"
          >
            {question.options.map((option, index) => (
              <div
                key={index}
                className={cn(
                  'quiz-option relative flex cursor-pointer items-start rounded-lg border p-4 transition-all duration-200',
                  selectedOption === option ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                )}
              >
                <RadioGroupItem
                  value={option}
                  id={`option-${question.id}-${index}`}
                  className="mt-1"
                />
                <Label
                  htmlFor={`option-${question.id}-${index}`}
                  className="ml-3 cursor-pointer font-normal"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      case 'text':
      case 'open-ended':
        return (
          <div className="space-y-4">
            <Textarea
              value={textValue}
              onChange={handleTextChange}
              placeholder="Type your answer here..."
              className="min-h-[100px]"
            />
            <VoiceInput onResult={handleVoiceInput} />
          </div>
        );
      case 'single':
        return (
          <div className="space-y-4">
            <RadioGroup 
              value={selectedOption} 
              onValueChange={(val) => {
                handleOptionChange(val);
                setShowOtherInput(val === 'Other');
                if (val !== 'Other') {
                  setOtherText('');
                }
              }}
            >
              {question.options.filter(opt => opt !== 'Other').map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option}>{option}</Label>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Other" id="Other" />
                <Label htmlFor="Other">Other</Label>
              </div>
            </RadioGroup>

            <AnimatePresence>
              {showOtherInput && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Input
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    placeholder="Please specify..."
                    className="mt-2"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            <VoiceInput onResult={handleVoiceInput} />
          </div>
        );
      case 'multiple':
        return (
          <div className="space-y-3">
            {question.options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={option}
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...selectedValues, option]
                      : selectedValues.filter((v) => v !== option);
                    handleMultipleChoiceChange(newValues);
                  }}
                />
                <Label htmlFor={option}>{option}</Label>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="other"
                checked={selectedValues.includes('Other')}
                onCheckedChange={(checked) => {
                  const newValues = checked
                    ? [...selectedValues, 'Other']
                    : selectedValues.filter((v) => v !== 'Other');
                  handleMultipleChoiceChange(newValues);
                  if (!checked) {
                    setOtherText('');
                  }
                }}
              />
              <Label htmlFor="other">Other</Label>
            </div>
            {selectedValues.includes('Other') && (
              <Textarea
                value={otherText}
                onChange={(e) => {
                  setOtherText(e.target.value);
                  const newValues = selectedValues.map(v => 
                    v === 'Other' ? `Other: ${e.target.value}` : v
                  );
                  handleMultipleChoiceChange(newValues);
                }}
                placeholder="Please specify..."
                className="mt-2"
              />
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="quiz-card">
      <CardContent className="pt-6">
        <h2 className="text-xl font-semibold mb-6">{question.question}</h2>
        {renderInput()}
      </CardContent>
    </Card>
  );
} 