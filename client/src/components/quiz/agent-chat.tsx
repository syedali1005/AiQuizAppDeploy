import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Send, Bot, User, X } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  isAgent: boolean;
  timestamp: Date;
}

export function AgentChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm here to help you with your AI audit assessment. Feel free to ask me any questions about the quiz questions, AI audit principles, or if you need clarification on any topic.",
      isAgent: true,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

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
    setIsTyping(true);

    // Simulate agent response (in real implementation, this would call an AI service)
    setTimeout(() => {
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getAgentResponse(inputMessage),
        isAgent: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, agentResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getAgentResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('ethics') || input.includes('ethical')) {
      return "AI Ethics focuses on ensuring AI systems are fair, transparent, and accountable. Key principles include avoiding bias, protecting privacy, and ensuring human oversight. Would you like me to explain any specific ethical principle?";
    }
    
    if (input.includes('compliance') || input.includes('regulation')) {
      return "Compliance in AI involves adhering to legal and regulatory requirements like GDPR, HIPAA, and emerging AI regulations. This includes data protection, transparency requirements, and user rights. What specific compliance area interests you?";
    }
    
    if (input.includes('risk') || input.includes('management')) {
      return "Risk Management in AI involves identifying, assessing, and mitigating potential risks from AI deployment. This includes technical risks, operational risks, and societal impacts. The key is implementing risk-by-design approaches with continuous monitoring.";
    }
    
    if (input.includes('implementation') || input.includes('deploy')) {
      return "AI Implementation best practices include proper testing, gradual rollout, human oversight mechanisms, and continuous monitoring. It's important to have rollback procedures and regular model retraining based on performance metrics.";
    }
    
    if (input.includes('help') || input.includes('stuck') || input.includes('confused')) {
      return "I'm here to help! You can ask me about any AI audit concept, request clarification on quiz questions, or get explanations about AI governance principles. What specific topic would you like assistance with?";
    }
    
    return "That's a great question! AI auditing involves systematically evaluating AI systems for compliance, ethics, and performance. Each question in this assessment tests different aspects of responsible AI deployment. Is there a particular area you'd like me to elaborate on?";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
      
      <DialogContent className="max-w-md h-[600px] flex flex-col glass-effect border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-foreground">
            <Bot className="w-5 h-5 text-primary" />
            <span>AI Audit Assistant</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col space-y-4">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 p-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-2 ${
                  message.isAgent ? 'justify-start' : 'justify-end'
                }`}
              >
                {message.isAgent && (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                
                <Card className={`max-w-[80%] ${
                  message.isAgent 
                    ? 'bg-muted/50 border-border/50' 
                    : 'bg-primary/20 border-primary/30'
                }`}>
                  <CardContent className="p-3">
                    <p className="text-sm text-foreground leading-relaxed">
                      {message.content}
                    </p>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </CardContent>
                </Card>
                
                {!message.isAgent && (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <Card className="bg-muted/50 border-border/50">
                  <CardContent className="p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          
          {/* Input */}
          <div className="flex space-x-2 p-2 border-t border-border/50">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about AI audit concepts..."
              className="flex-1 min-h-[40px] max-h-[80px] resize-none bg-background/50"
              disabled={isTyping}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="gradient-bg hover:scale-105 transition-all duration-300"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}