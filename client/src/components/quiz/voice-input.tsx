import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VoiceInputProps {
  onResult: (text: string) => void;
  placeholder?: string;
}

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
  new (): SpeechRecognition;
}

export function VoiceInput({ onResult, placeholder = 'Click to speak...' }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Initialize speech recognition
        const SpeechRecognition = (window.SpeechRecognition || window.webkitSpeechRecognition) as {
          new (): SpeechRecognition;
        };
        
        if (!SpeechRecognition) {
          setError('Speech recognition is not supported in your browser');
          return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          try {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            setTranscript(transcript);
            
            if (event.results[current].isFinal) {
              onResult(transcript);
              setIsListening(false);
            }
          } catch (err) {
            console.error('Error processing speech result:', err);
            setError('Error processing speech. Please try again.');
            setIsListening(false);
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          setError(`Speech recognition error: ${event.error}`);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognition);
      } catch (err) {
        console.error('Error initializing speech recognition:', err);
        setError('Speech recognition initialization failed');
      }
    }
  }, [onResult]);

  const toggleListening = () => {
    if (!recognition) {
      setError('Speech recognition not supported');
      return;
    }

    setError(null);

    try {
      if (isListening) {
        recognition.stop();
      } else {
        setTranscript('');
        recognition.start();
        setIsListening(true);
      }
    } catch (err) {
      console.error('Error toggling speech recognition:', err);
      setError('Error starting speech recognition');
      setIsListening(false);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        onClick={toggleListening}
        variant={isListening ? "destructive" : "default"}
        className="relative group animate-pulse-glow"
        disabled={!recognition}
      >
        {isListening ? (
          <>
            <MicOff className="w-5 h-5 mr-2" />
            Stop Recording
          </>
        ) : (
          <>
            <Mic className="w-5 h-5 mr-2" />
            Start Recording
          </>
        )}
      </Button>
      
      {isListening && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Listening...
        </div>
      )}
      
      {transcript && (
        <div className="mt-2 text-sm text-muted-foreground">
          "{transcript}"
        </div>
      )}
    </div>
  );
}

// Add type declaration for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
} 