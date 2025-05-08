
import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StorySession, Timer } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StoryDisplayProps {
  session: StorySession;
  timer: Timer | null;
}

const StoryDisplay: React.FC<StoryDisplayProps> = ({ session, timer }) => {
  const storyTextRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Auto-scroll logic based on timer progress
    if (timer && timer.isRunning && !timer.isPaused && storyTextRef.current && scrollAreaRef.current) {
      const totalSeconds = session.durationMinutes * 60;
      const elapsedSeconds = totalSeconds - (timer.timeRemaining || 0);
      const scrollProgress = elapsedSeconds / totalSeconds;
      
      const scrollHeight = storyTextRef.current.scrollHeight - (scrollAreaRef.current.clientHeight || 0);
      const scrollPosition = scrollHeight * scrollProgress;
      
      // Use smooth scrolling for better user experience
      scrollAreaRef.current.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
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
          className={cn(
            "leading-relaxed mb-4",
            index === currentParaIndex && timer?.isRunning && !timer?.isPaused
              ? "bg-primary/10 -mx-2 px-2 py-1 rounded transition-colors duration-200 animate-pulse"
              : index < currentParaIndex
                ? "text-muted-foreground"
                : ""
          )}
          data-active={index === currentParaIndex && timer?.isRunning && !timer?.isPaused}
        >
          {paragraph}
        </p>
      ));
    }
    
    // For interval mode, split by "Chapter" headings
    const chapters = session.storyText.split(/Chapter \d+/g).filter(Boolean);
    const chapterTitles = session.storyText.match(/Chapter \d+/g) || [];
    
    return chapters.map((chapter, index) => {
      // Fix: Safely check for timer and currentInterval
      const isActive = timer?.currentInterval === index;
      const isCompleted = timer?.currentInterval !== null && 
                          timer.currentInterval > index;
      
      return (
        <div 
          key={index} 
          className={cn(
            "mb-8",
            isActive 
              ? "opacity-100 bg-primary/10 -mx-2 px-2 py-1 rounded"
              : isCompleted
                ? "opacity-50"
                : "opacity-75",
            "transition-opacity duration-300"
          )}
        >
          <h3 className={cn(
            "text-xl font-semibold mb-2",
            isActive && timer?.isRunning && !timer?.isPaused && "animate-pulse"
          )}>
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
          ref={scrollAreaRef}
        >
          <div className="pr-4" ref={storyTextRef}>
            {renderStoryText()}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default StoryDisplay;
