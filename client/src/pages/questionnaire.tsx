import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';

// Sample questions data with more types
const questions = [
  {
    id: 1,
    type: 'single',
    question: 'What is your favorite color?',
    options: ['Red', 'Blue', 'Green', 'Yellow'],
  },
  {
    id: 2,
    type: 'multiple',
    question: 'Which programming languages do you know?',
    options: ['JavaScript', 'Python', 'Java', 'C++'],
  },
  {
    id: 3,
    type: 'text',
    question: 'What is your dream job?',
    options: [],
  },
  {
    id: 4,
    type: 'rating',
    question: 'How satisfied are you with your current work-life balance?',
    options: [1, 2, 3, 4, 5],
  },
  {
    id: 5,
    type: 'dropdown',
    question: 'Select your country',
    options: ['USA', 'Canada', 'UK', 'India', 'Other'],
  },
  {
    id: 6,
    type: 'date',
    question: 'When is your birthday?',
    options: [],
  },
];

function QuestionCard({ question, value, onChange }: any) {
  if (question.type === 'single') {
    return (
      <div>
        <p className="font-medium mb-2">{question.question}</p>
        <div className="space-y-2">
          {question.options.map((opt: string) => (
            <label key={opt} className="flex items-center gap-2">
              <input
                type="radio"
                name={`q-${question.id}`}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      </div>
    );
  }
  if (question.type === 'multiple') {
    return (
      <div>
        <p className="font-medium mb-2">{question.question}</p>
        <div className="space-y-2">
          {question.options.map((opt: string) => (
            <label key={opt} className="flex items-center gap-2">
              <input
                type="checkbox"
                name={`q-${question.id}`}
                value={opt}
                checked={Array.isArray(value) && value.includes(opt)}
                onChange={() => {
                  if (Array.isArray(value)) {
                    if (value.includes(opt)) {
                      onChange(value.filter((v: string) => v !== opt));
                    } else {
                      onChange([...value, opt]);
                    }
                  } else {
                    onChange([opt]);
                  }
                }}
              />
              {opt}
            </label>
          ))}
        </div>
      </div>
    );
  }
  if (question.type === 'text') {
    return (
      <div>
        <p className="font-medium mb-2">{question.question}</p>
        <input
          className="border rounded px-2 py-1 w-full"
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="Type your answer..."
        />
      </div>
    );
  }
  if (question.type === 'rating') {
    return (
      <div>
        <p className="font-medium mb-2">{question.question}</p>
        <div className="flex gap-2">
          {question.options.map((opt: number) => (
            <button
              key={opt}
              type="button"
              className={`text-2xl ${value === opt ? 'text-yellow-400' : 'text-gray-400'}`}
              aria-label={`Rate ${opt}`}
              onClick={() => onChange(opt)}
            >
              ★
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (question.type === 'dropdown') {
    return (
      <div>
        <p className="font-medium mb-2">{question.question}</p>
        <select
          className="border rounded px-2 py-1 w-full"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        >
          <option value="" disabled>Select...</option>
          {question.options.map((opt: string) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }
  if (question.type === 'date') {
    return (
      <div>
        <p className="font-medium mb-2">{question.question}</p>
        <input
          className="border rounded px-2 py-1 w-full"
          type="date"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    );
  }
  return null;
}

function ResultsSummary({ answers }: any) {
  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded shadow text-center">
      <h2 className="text-xl font-bold mb-4">Thank you for completing the questionnaire!</h2>
      <div className="space-y-4">
        {questions.map(q => (
          <div key={q.id} className="text-left">
            <div className="font-semibold">{q.question}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {Array.isArray(answers[q.id])
                ? (answers[q.id] as string[]).join(', ')
                : answers[q.id] || <span className="italic">No answer</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Questionnaire() {
  // User authentication (username only)
  const [username, setUsername] = useState<string>(() => localStorage.getItem('questionnaire-username') || '');
  const [inputName, setInputName] = useState('');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<any>(() => {
    const saved = localStorage.getItem(`questionnaire-answers-${username}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [submitted, setSubmitted] = useState(false);

  // Save answers to localStorage on change
  useEffect(() => {
    if (username) {
      localStorage.setItem(`questionnaire-answers-${username}`, JSON.stringify(answers));
    }
  }, [answers, username]);

  // Save username to localStorage
  useEffect(() => {
    if (username) {
      localStorage.setItem('questionnaire-username', username);
    }
  }, [username]);

  const current = questions[step];
  const progress = ((step) / questions.length) * 100;

  // Progress sidebar
  const ProgressSidebar = () => (
    <div className="hidden md:block w-56 mr-8">
      <div className="bg-white dark:bg-gray-900 rounded shadow p-4 sticky top-8">
        <h2 className="text-lg font-bold mb-4">Progress</h2>
        <ul className="space-y-2">
          {questions.map((q, idx) => (
            <li key={q.id} className={`flex items-center gap-2 ${step === idx ? 'font-bold text-primary' : ''}`}>
              <span className={`w-6 h-6 flex items-center justify-center rounded-full border ${answers[q.id] ? 'bg-green-200 dark:bg-green-700' : 'bg-gray-100 dark:bg-gray-800'}`}>{idx + 1}</span>
              <span className="truncate">{q.question.slice(0, 20)}...</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  // Require answer before next
  const isAnswered = (q: any, val: any) => {
    if (q.type === 'multiple') return Array.isArray(val) && val.length > 0;
    return val !== undefined && val !== '' && val !== null;
  };

  // Animate transitions
  const [transitioning, setTransitioning] = useState(false);
  const handleNext = () => {
    if (!isAnswered(current, answers[current.id])) return;
    setTransitioning(true);
    setTimeout(() => {
      setTransitioning(false);
      if (step < questions.length - 1) {
        setStep(step + 1);
      } else {
        setSubmitted(true);
      }
    }, 250);
  };
  const handlePrev = () => {
    setTransitioning(true);
    setTimeout(() => {
      setTransitioning(false);
      setStep(Math.max(0, step - 1));
    }, 250);
  };

  // Show login form if not authenticated
  if (!username) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded shadow p-8">
          <h1 className="text-2xl font-bold mb-4">Welcome to the Questionnaire</h1>
          <form
            onSubmit={e => {
              e.preventDefault();
              if (inputName.trim()) setUsername(inputName.trim());
            }}
            className="space-y-4"
          >
            <input
              className="border rounded px-2 py-1 w-full"
              type="text"
              placeholder="Enter your name to begin"
              value={inputName}
              onChange={e => setInputName(e.target.value)}
              required
            />
            <Button type="submit" className="w-full">Start</Button>
          </form>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="w-full max-w-lg">
          <ResultsSummary answers={answers} />
          <Button className="mt-6" onClick={() => { setStep(0); setAnswers({}); setSubmitted(false); localStorage.removeItem(`questionnaire-answers-${username}`); }}>
            Restart
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <ProgressSidebar />
      <div className={`w-full max-w-lg bg-white dark:bg-gray-900 rounded shadow p-8 transition-all duration-300 ${transitioning ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Questionnaire</h1>
          <ThemeSwitcher />
        </div>
        <Progress value={progress} className="mb-6" />
        <QuestionCard
          question={current}
          value={answers[current.id]}
          onChange={(val: unknown) => setAnswers((a: any) => ({ ...a, [current.id]: val }))}
        />
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={handlePrev} disabled={step === 0}>
            Previous
          </Button>
          <Button onClick={handleNext} disabled={!isAnswered(current, answers[current.id])}>
            {step === questions.length - 1 ? 'Submit' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
} 