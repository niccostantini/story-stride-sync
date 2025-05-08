
import React from 'react';
import { cn } from '@/lib/utils';
import { Timer, StorySession } from '@/types';

interface SessionModeStoryProps {
  storyText: string;
  timer: Timer | null;
  totalDuration: number;
  session: StorySession;
}

const SessionModeStory: React.FC<SessionModeStoryProps> = ({ storyText, timer, totalDuration, session }) => {
  // Split story into paragraphs
  const paragraphs = typeof storyText === 'string' 
    ? storyText.split(/\n+/).filter(Boolean) 
    : [];
  
  // Calculate elapsed exercise time (not counting pauses or rests)
  const calculateExerciseTimeElapsed = () => {
    if (!timer || !session) return 0;
    
    // Sum up completed intervals durations
    let elapsed = 0;
    
    // Add completed sets
    for (let i = 0; i < timer.currentSetIndex; i++) {
      const set = session.sets[i];
      if (set) {
        elapsed += set.intervals.reduce((sum, interval) => sum + interval.duration, 0);
      }
    }
    
    // Add completed intervals in current set
    if (timer.currentSetIndex < session.sets.length && timer.currentIntervalIndex > 0) {
      const currentSet = session.sets[timer.currentSetIndex];
      for (let i = 0; i < timer.currentIntervalIndex; i++) {
        const interval = currentSet.intervals[i];
        if (interval) {
          elapsed += interval.duration;
        }
      }
    }
    
    // Add elapsed time in current interval if not in pause/rest
    if (!timer.isInPause && !timer.isInRest && 
        timer.currentSetIndex < session.sets.length && 
        timer.currentIntervalIndex < session.sets[timer.currentSetIndex]?.intervals.length) {
      const currentInterval = session.sets[timer.currentSetIndex]?.intervals[timer.currentIntervalIndex];
      if (currentInterval) {
        const intervalProgress = currentInterval.duration > 0 
          ? 1 - (timer.timeRemaining / currentInterval.duration) 
          : 0;
        
        elapsed += currentInterval.duration * Math.max(0, Math.min(1, intervalProgress));
      }
    }
    
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
