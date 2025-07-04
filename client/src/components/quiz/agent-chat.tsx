import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Send, Bot, User } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Question, QuizSession } from '@shared/schema';

interface Message {
  id: string;
  content: string;
  isAgent: boolean;
  timestamp: Date;
}

interface AgentChatProps {
  sessionId?: number;
  currentCategory?: string;
}

export function AgentChat({ sessionId, currentCategory = 'General' }: AgentChatProps) {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your AI Audit Assistant from SPARK AI. I can help you understand the assessment questions, suggest AI solutions for your departments, and provide guidance on improving your organization's AI efficiency. What would you like to know?",
      isAgent: true,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  // Fetch session data if sessionId is provided
  const { data: session } = useQuery<QuizSession>({
    queryKey: ['/api/quiz-sessions', sessionId],
    enabled: !!sessionId,
  });

  // Fetch questions for context
  const { data: questions } = useQuery<Question[]>({
    queryKey: ['/api/questions'],
    enabled: isOpen, // Only fetch when chat is opened
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/ai/chat', {
        message,
        category: currentCategory,
        questionType: 'assessment',
        sessionId,
        answers: session?.answers || {}
      });
      return response.json();
    },
    onError: (error) => {
      console.error('Chat API error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isAgent: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    try {
      const response = await chatMutation.mutateAsync(inputMessage);
      
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response || "I apologize, but I'm having trouble responding right now. Please try again.",
        isAgent: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, agentResponse]);
    } catch (error) {
      // Error is handled by the mutation's onError callback
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    };
    
    // Scroll immediately and after a short delay to ensure content is rendered
    scrollToBottom();
    const timeoutId = setTimeout(scrollToBottom, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white hover:bg-white/20 border border-white/20 animate-pulse-glow"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Talk to Agent
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-[380px] h-[500px] flex flex-col glass-effect border-border/50 p-3">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center space-x-2 text-foreground text-sm">
            <Bot className="w-4 h-4 text-primary" />
            <span>SPARK AI Assistant</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-1 py-2 space-y-2">
            <div className="flex flex-col space-y-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-2 ${
                    message.isAgent ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {message.isAgent && (
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                  )}
                  
                  <Card className={`max-w-[85%] ${
                    message.isAgent 
                      ? 'bg-muted/50 border-border/50' 
                      : 'bg-primary/20 border-primary/30'
                  }`}>
                    <CardContent className="p-2">
                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <span className="text-[10px] text-muted-foreground mt-1 block">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </CardContent>
                  </Card>
                  
                  {!message.isAgent && (
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-3 h-3 text-primary" />
                    </div>
                  )}
                </div>
              ))}
              
              {chatMutation.isPending && (
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                  <Card className="bg-muted/50 border-border/50">
                    <CardContent className="p-2">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              <div ref={messagesEndRef} style={{ height: '1px' }} />
            </div>
          </div>
          
          {/* Input */}
          <div className="flex space-x-2 p-1 border-t border-border/50 mt-auto">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question..."
              className="flex-1 min-h-[36px] max-h-[80px] resize-none bg-background/50 text-xs p-2"
              disabled={chatMutation.isPending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || chatMutation.isPending}
              className="gradient-bg hover:scale-105 transition-all duration-300"
              size="sm"
            >
              <Send className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}