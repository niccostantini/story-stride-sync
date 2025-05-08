
import React from 'react';
import { cn } from '@/lib/utils';
import { Timer } from '@/types';

interface SessionModeStoryProps {
  storyText: string;
  timer: Timer | null;
  totalDuration: number;
}

const SessionModeStory: React.FC<SessionModeStoryProps> = ({ storyText, timer, totalDuration }) => {
  // Split story into paragraphs
  const paragraphs = typeof storyText === 'string' 
    ? storyText.split(/\n+/).filter(Boolean) 
    : [];
  
  // Calculate elapsed exercise time (not counting pauses or rests)
  const calculateExerciseTimeElapsed = () => {
    if (!timer) return 0;
    
    // Sum up completed intervals durations
    let elapsed = 0;
    
    // This function is only used for session mode stories
    return elapsed;
  };
  
  // Calculate reading progress
  const progress = totalDuration > 0 ? calculateExerciseTimeElapsed() / totalDuration : 0;
  const currentParaIndex = Math.min(Math.floor(progress * paragraphs.length), paragraphs.length - 1);
  
  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p 
          key={index} 
          className={cn(
            "leading-relaxed mb-4",
            index === currentParaIndex && timer?.isRunning && !timer?.isPaused && !timer?.isInPause && !timer?.isInRest
              ? "bg-primary/10 -mx-2 px-2 py-1 rounded transition-colors duration-200 animate-pulse"
              : index < currentParaIndex
                ? "text-muted-foreground"
                : ""
          )}
        >
          {paragraph}
        </p>
      ))}
    </>
  );
};

export default SessionModeStory;
