import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { QuizResult } from '@shared/schema';

interface ThankYouViewProps {
  sessionId: number;
  onStartNew: () => void;
}

export function ThankYouView({ sessionId, onStartNew }: ThankYouViewProps) {
  const { data: results = [], isLoading } = useQuery<QuizResult[]>({
    queryKey: ['/api/quiz-results/session', sessionId],
  });

  const result = results[0];

  if (isLoading || !result) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto py-12 px-4"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Thank You for Completing the Assessment!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* AI Efficiency Score Circle */}
          <div className="relative w-48 h-48 mx-auto">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                className="text-gray-200"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
              <motion.circle
                className="text-primary"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
                initial={{ strokeDasharray: "251.2", strokeDashoffset: "251.2" }}
                animate={{ strokeDashoffset: 251.2 - (251.2 * result.aiEfficiencyScore) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{
                  transformOrigin: "50% 50%",
                  transform: "rotate(-90deg)",
                }}
              />
              <text
                x="50"
                y="45"
                className="text-2xl font-bold"
                textAnchor="middle"
                fill="currentColor"
              >
                {result.aiEfficiencyScore}%
              </text>
              <text
                x="50"
                y="65"
                className="text-xs"
                textAnchor="middle"
                fill="currentColor"
              >
                AI Efficiency
              </text>
            </svg>
          </div>

          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">
              Your Efficiency in Using AI Is: {result.aiEfficiencyScore}%
            </h3>
            <p className="text-gray-600">
              Based on your responses, we've analyzed your understanding and application of AI tools.
            </p>
          </div>

          <div className="flex justify-center pt-4">
            <Button onClick={onStartNew} className="w-full max-w-sm">
              Start New Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 