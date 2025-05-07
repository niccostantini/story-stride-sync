
import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StorySession, Timer } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

interface StoryDisplayProps {
  session: StorySession;
  timer: Timer | null;
}

const StoryDisplay: React.FC<StoryDisplayProps> = ({ session, timer }) => {
  const storyTextRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Auto-scroll logic based on timer progress
    if (timer && timer.isRunning && !timer.isPaused && storyTextRef.current) {
      const totalSeconds = session.durationMinutes * 60;
      const elapsedSeconds = totalSeconds - (timer.timeRemaining || 0);
      const scrollProgress = elapsedSeconds / totalSeconds;
      
      const scrollHeight = storyTextRef.current.scrollHeight - storyTextRef.current.clientHeight;
      const scrollPosition = scrollHeight * scrollProgress;
      
      storyTextRef.current.scrollTop = scrollPosition;
    }
  }, [timer, session]);
  
  // Determine the current progress through the story
  const getReadingProgress = () => {
    if (!timer || !session) return 0;
    
    const totalSeconds = session.durationMinutes * 60;
    const elapsedSeconds = totalSeconds - (timer.timeRemaining || 0);
    
    return elapsedSeconds / totalSeconds;
  };
  
  // Split text into chapters if in interval mode
  const renderStoryText = () => {
    if (!session.storyAudioUrl) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      );
    }
    
    if (!session.isIntervalMode) {
      const progress = getReadingProgress();
      const textContent = session.storyText;
      
      // Split text into paragraphs
      const paragraphs = textContent.split(/\n+/).filter(Boolean);
      
      // Calculate which paragraph should be highlighted based on progress
      const totalParagraphs = paragraphs.length;
      const currentParaIndex = Math.min(
        Math.floor(progress * totalParagraphs),
        totalParagraphs - 1
      );
      
      return paragraphs.map((paragraph, index) => (
        <p 
          key={index} 
          className={`leading-relaxed mb-4 ${
            index === currentParaIndex && timer?.isRunning && !timer?.isPaused
              ? 'bg-primary/10 -mx-2 px-2 py-1 rounded transition-colors duration-200'
              : index < currentParaIndex
                ? 'text-muted-foreground'
                : ''
          }`}
        >
          {paragraph}
        </p>
      ));
    }
    
    // For interval mode, split by "Chapter" headings
    const chapters = session.storyText.split(/Chapter \d+/g).filter(Boolean);
    const chapterTitles = session.storyText.match(/Chapter \d+/g) || [];
    
    return chapters.map((chapter, index) => {
      const isActive = timer?.currentInterval === index;
      const isCompleted = timer?.currentInterval !== null && 
                          timer.currentInterval > index;
      
      return (
        <div 
          key={index} 
          className={`mb-8 ${
            isActive 
              ? "opacity-100 bg-primary/10 -mx-2 px-2 py-1 rounded"
              : isCompleted
                ? "opacity-50"
                : "opacity-75"
          } transition-opacity duration-300`}
        >
          <h3 className="text-xl font-semibold mb-2">
            {chapterTitles[index] || `Chapter ${index + 1}`}
          </h3>
          <p className="leading-relaxed whitespace-pre-line">{chapter}</p>
        </div>
      );
    });
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="py-4">
        <h3 className="text-xl font-semibold mb-2">Your Story</h3>
        <ScrollArea 
          className="h-[200px] rounded-md border p-4" 
          ref={storyTextRef}
        >
          <div className="pr-4">
            {renderStoryText()}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default StoryDisplay;
