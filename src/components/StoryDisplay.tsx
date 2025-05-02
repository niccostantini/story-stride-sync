
import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StorySession, Timer } from '@/types';

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
  
  // Split text into chapters if in interval mode
  const renderStoryText = () => {
    if (!session.isIntervalMode) {
      return <p className="leading-relaxed whitespace-pre-line">{session.storyText}</p>;
    }
    
    // For interval mode, split by "Chapter" headings
    const chapters = session.storyText.split(/Chapter \d+/g).filter(Boolean);
    const chapterTitles = session.storyText.match(/Chapter \d+/g) || [];
    
    return chapters.map((chapter, index) => {
      const isActive = timer?.currentInterval === index;
      
      return (
        <div 
          key={index} 
          className={`mb-8 ${isActive ? "opacity-100" : "opacity-50"} transition-opacity duration-300`}
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
