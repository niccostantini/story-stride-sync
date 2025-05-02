
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import confetti from 'canvas-confetti';

interface SessionCompleteProps {
  onStartNew: () => void;
}

const SessionComplete: React.FC<SessionCompleteProps> = ({ onStartNew }) => {
  React.useEffect(() => {
    // Trigger confetti effect when component mounts
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
    
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      
      const particleCount = 50 * (timeLeft / duration);
      
      // Confetti burst
      confetti({
        particleCount: Math.floor(randomInRange(20, 50)),
        spread: randomInRange(60, 100),
        origin: { y: 0.6, x: randomInRange(0.2, 0.8) },
        colors: ['#9b87f5', '#7E69AB', '#F97316', '#33C3F0'],
        disableForReducedMotion: true,
      });
    }, 250);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto animate-scale-in">
      <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-purple flex items-center justify-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-12 w-12 text-white" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>
        
        <div>
          <h2 className="text-3xl font-bold mb-2">Workout Complete!</h2>
          <p className="text-muted-foreground">
            Great job on finishing your story workout!
          </p>
        </div>
        
        <Button 
          onClick={onStartNew}
          size="lg"
          className="px-8"
        >
          Start a New Story
        </Button>
      </CardContent>
    </Card>
  );
};

export default SessionComplete;
