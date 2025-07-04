import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lightbulb, ArrowRight, CheckCircle, ExternalLink, Star, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SolutionSuggestionsProps {
  category: string;
  questionType: string;
}

interface Suggestion {
  title: string;
  description: string;
  tools: Array<{
    name: string;
    type: 'free' | 'paid' | 'freemium';
    rating: number;
    setupTime: 'quick' | 'medium' | 'complex';
  }>;
  benefits: string[];
}

type CategorySuggestions = {
  [key: string]: {
    [key: string]: Suggestion[];
  };
};

export function SolutionSuggestions({ category, questionType }: SolutionSuggestionsProps) {
  const getSuggestions = (category: string, type: string): Suggestion[] => {
    const suggestions: CategorySuggestions = {
      'Sales Department': {
        'multiple-choice': [
          {
            title: 'CRM Implementation',
            description: 'Streamline your sales process with a modern CRM system that automates lead management and follow-ups.',
            tools: [
              { name: 'Salesforce', type: 'paid', rating: 4.8, setupTime: 'complex' },
              { name: 'HubSpot', type: 'freemium', rating: 4.6, setupTime: 'medium' },
              { name: 'Zoho CRM', type: 'freemium', rating: 4.4, setupTime: 'quick' }
            ],
            benefits: [
              'Centralized customer data',
              'Automated lead scoring',
              'Sales forecasting',
              'Pipeline visualization'
            ]
          },
          {
            title: 'Email Automation',
            description: 'Set up intelligent email sequences that nurture leads and keep your sales pipeline moving.',
            tools: [
              { name: 'Mailchimp', type: 'freemium', rating: 4.5, setupTime: 'quick' },
              { name: 'SendGrid', type: 'freemium', rating: 4.3, setupTime: 'medium' },
              { name: 'ActiveCampaign', type: 'paid', rating: 4.7, setupTime: 'medium' }
            ],
            benefits: [
              'Personalized follow-ups',
              'A/B testing',
              'Performance analytics',
              'Template management'
            ]
          }
        ],
        'text': [
          {
            title: 'Pipeline Management',
            description: 'Visualize and optimize your sales pipeline with drag-and-drop simplicity.',
            tools: [
              { name: 'Monday.com', type: 'freemium', rating: 4.7, setupTime: 'quick' },
              { name: 'Trello', type: 'freemium', rating: 4.5, setupTime: 'quick' },
              { name: 'Asana', type: 'freemium', rating: 4.6, setupTime: 'medium' }
            ],
            benefits: [
              'Visual workflow management',
              'Team collaboration',
              'Progress tracking',
              'Custom pipelines'
            ]
          }
        ]
      },
      'Marketing Department': {
        'multiple-choice': [
          {
            title: 'Content Automation',
            description: 'Scale your content creation and distribution with AI-powered tools.',
            tools: [
              { name: 'Buffer', type: 'freemium', rating: 4.6, setupTime: 'quick' },
              { name: 'Hootsuite', type: 'paid', rating: 4.5, setupTime: 'medium' },
              { name: 'Later', type: 'freemium', rating: 4.4, setupTime: 'quick' }
            ],
            benefits: [
              'Scheduled publishing',
              'Content calendar',
              'Analytics dashboard',
              'Multi-platform support'
            ]
          }
        ]
      }
    };

    return suggestions[category]?.[type] || [];
  };

  const suggestions = getSuggestions(category, questionType);

  const getSetupTimeIcon = (setupTime: string) => {
    switch (setupTime) {
      case 'quick': return <Badge variant="outline" className="bg-indigo-100/50 text-indigo-800 border-indigo-200">Quick Setup</Badge>;
      case 'medium': return <Badge variant="outline" className="bg-purple-100/50 text-purple-800 border-purple-200">Medium Setup</Badge>;
      case 'complex': return <Badge variant="outline" className="bg-pink-100/50 text-pink-800 border-pink-200">Complex Setup</Badge>;
      default: return null;
    }
  };

  const getPricingBadge = (type: string) => {
    switch (type) {
      case 'free': return <Badge className="bg-indigo-100/50 text-indigo-800 border-indigo-200">Free</Badge>;
      case 'paid': return <Badge className="bg-purple-100/50 text-purple-800 border-purple-200">Paid</Badge>;
      case 'freemium': return <Badge className="bg-pink-100/50 text-pink-800 border-pink-200">Freemium</Badge>;
      default: return null;
    }
  };

  if (!suggestions.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-none shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-indigo-900">
            <Lightbulb className="w-5 h-5 text-indigo-600" />
            <span>Department-Specific Solutions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {suggestions.map((suggestion: Suggestion, index: number) => (
              <motion.div
                key={suggestion.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-white via-white to-indigo-50/30 rounded-xl p-6 shadow-lg backdrop-blur-sm border border-indigo-100/50"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-indigo-900 flex items-center space-x-2">
                    <ArrowRight className="w-5 h-5 text-indigo-500" />
                    <span>{suggestion.title}</span>
                  </h3>
                </div>

                <p className="text-gray-600 mb-4">{suggestion.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-indigo-900 mb-2">Key Benefits:</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {suggestion.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-indigo-900 mb-2">Recommended Tools:</h4>
                    <div className="space-y-2">
                      {suggestion.tools.map((tool) => (
                        <div
                          key={tool.name}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/50 hover:bg-indigo-50/50 transition-colors border border-indigo-100/30"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="font-medium text-indigo-900">{tool.name}</span>
                            <div className="flex items-center space-x-2">
                              {getPricingBadge(tool.type)}
                              {getSetupTimeIcon(tool.setupTime)}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-indigo-400" />
                              <span className="ml-1 text-sm text-gray-600">{tool.rating}</span>
                            </div>
                            <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-800">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 