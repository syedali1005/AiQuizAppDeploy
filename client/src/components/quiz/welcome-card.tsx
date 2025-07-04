import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SparkAILogo } from '@/components/ui/logo';
import { Info, HelpCircle, Mail } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export interface UserDetails {
  name: string;
  companyName: string;
  email: string;
  contactNumber: string;
}

interface WelcomeCardProps {
  onComplete: (details: UserDetails) => void;
}

export function WelcomeCard({ onComplete }: WelcomeCardProps) {
  const { toast } = useToast();
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: '',
    companyName: '',
    email: '',
    contactNumber: ''
  });

  const [errors, setErrors] = useState<Partial<UserDetails>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Partial<UserDetails> = {};
    
    if (!userDetails.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!userDetails.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    
    if (!userDetails.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userDetails.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!userDetails.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(userDetails.contactNumber.replace(/[\s-]/g, ''))) {
      newErrors.contactNumber = 'Please enter a valid contact number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        await onComplete(userDetails);
      } catch (error) {
        console.error('Error submitting user details:', error);
        toast({
          title: "Error",
          description: "Failed to save your details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleInputChange = (field: keyof UserDetails, value: string) => {
    setUserDetails(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-primary/10 px-2"
    >
      <Card className="p-8 max-w-2xl w-full mx-auto bg-background/70 backdrop-blur-2xl shadow-2xl border-2 border-primary/10 rounded-3xl glassy-card">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          <div className="flex flex-col items-center space-y-2">
            <SparkAILogo className="h-10 w-auto mb-1 animate-fade-in" />
            <h1 className="text-3xl font-extrabold text-primary text-center">Welcome to the AI Readiness Assessment</h1>
            <p className="text-muted-foreground text-center max-w-md">
              Take 2 minutes to help us personalize your AI audit. Your details are safe and only used for assessment results.
            </p>
            <span className="text-xs text-primary/80 bg-primary/10 px-3 py-1 rounded-full mt-2">Step 1 of 2</span>
            {/* Progress Bar */}
            <div className="w-full max-w-xs h-2 bg-primary/10 rounded-full mt-2">
              <div className="h-2 bg-primary rounded-full transition-all duration-500" style={{ width: '50%' }} />
            </div>
            {/* 100% free badge */}
            <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full mt-2 font-medium">100% free, no spam</span>
          </div>

          <div className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
              <Label htmlFor="name">Your Name</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" tabIndex={-1}><HelpCircle className="w-4 h-4 text-primary/60 hover:text-primary" /></button>
                  </PopoverTrigger>
                  <PopoverContent className="text-xs max-w-xs">We use your name to personalize your report and communications.</PopoverContent>
                </Popover>
              </div>
              <Input
                id="name"
                value={userDetails.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                className={errors.name ? 'border-destructive' : ''}
                onKeyPress={handleKeyPress}
                disabled={isSubmitting}
                aria-describedby="name-help"
              />
              <p id="name-help" className="text-xs text-muted-foreground flex items-center gap-1"><Info className="w-3 h-3" />This helps us personalize your report.</p>
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Company Name Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
              <Label htmlFor="companyName">Company Name</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" tabIndex={-1}><HelpCircle className="w-4 h-4 text-primary/60 hover:text-primary" /></button>
                  </PopoverTrigger>
                  <PopoverContent className="text-xs max-w-xs">We use your company name for benchmarking and industry insights.</PopoverContent>
                </Popover>
              </div>
              <Input
                id="companyName"
                value={userDetails.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="Enter your company name"
                className={errors.companyName ? 'border-destructive' : ''}
                onKeyPress={handleKeyPress}
                disabled={isSubmitting}
                aria-describedby="company-help"
              />
              <p id="company-help" className="text-xs text-muted-foreground flex items-center gap-1"><Info className="w-3 h-3" />Used for benchmarking industry results.</p>
              {errors.companyName && (
                <p className="text-sm text-destructive">{errors.companyName}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
              <Label htmlFor="email">Email Address</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" tabIndex={-1}><HelpCircle className="w-4 h-4 text-primary/60 hover:text-primary" /></button>
                  </PopoverTrigger>
                  <PopoverContent className="text-xs max-w-xs">We send your results and insights to this email. No spam, ever.</PopoverContent>
                </Popover>
              </div>
              <Input
                id="email"
                type="email"
                value={userDetails.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email address"
                className={errors.email ? 'border-destructive' : ''}
                onKeyPress={handleKeyPress}
                disabled={isSubmitting}
                aria-describedby="email-help"
              />
              <p id="email-help" className="text-xs text-muted-foreground flex items-center gap-1"><Info className="w-3 h-3" />We send your results and insights here.</p>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Contact Number Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
              <Label htmlFor="contactNumber">Contact Number</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" tabIndex={-1}><HelpCircle className="w-4 h-4 text-primary/60 hover:text-primary" /></button>
                  </PopoverTrigger>
                  <PopoverContent className="text-xs max-w-xs">Optional. We may use this to follow up or provide support if needed.</PopoverContent>
                </Popover>
              </div>
              <Input
                id="contactNumber"
                type="tel"
                value={userDetails.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                placeholder="Enter your contact number"
                className={errors.contactNumber ? 'border-destructive' : ''}
                onKeyPress={handleKeyPress}
                disabled={isSubmitting}
                aria-describedby="contact-help"
              />
              <p id="contact-help" className="text-xs text-muted-foreground flex items-center gap-1"><Info className="w-3 h-3" />Optional: For follow-up or support.</p>
              {errors.contactNumber && (
                <p className="text-sm text-destructive">{errors.contactNumber}</p>
              )}
            </div>
          </div>

          {/* Start Assessment Button and Learn More */}
          <div className="flex flex-col items-center gap-2">
          <Button
            onClick={handleSubmit}
              className="w-full gradient-bg hover:scale-105 transition-all duration-300 shadow-lg text-lg py-3"
            disabled={isSubmitting}
              aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span>Setting up your assessment...</span>
                <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </>
            ) : (
              <>
                <span>Start Assessment</span>
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-xs text-primary underline hover:text-primary/80 mt-1">Learn more about this assessment</button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>About the AI Readiness Assessment</DialogTitle>
                  <DialogDescription>
                    This assessment helps you understand your organization's current AI adoption and automation opportunities. Your answers are confidential and used only to generate your personalized report. For questions, contact us anytime.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
            <p className="text-xs text-muted-foreground text-center mt-2">
              <Info className="inline w-3 h-3 mr-1" />
              <span>Your information is confidential and used only for assessment purposes. <br />We never share your data.</span>
            </p>
            <a href="mailto:support@sparkai.com" className="flex items-center gap-1 text-xs text-primary/80 hover:underline mt-1"><Mail className="w-3 h-3" />Contact us</a>
          </div>
        </motion.div>
      </Card>
    </motion.div>
  );
} 