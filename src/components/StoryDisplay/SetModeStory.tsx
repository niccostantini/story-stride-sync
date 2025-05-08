
import React from 'react';
import { cn } from '@/lib/utils';
import { StorySession, Timer } from '@/types';
import { Badge } from '@/components/ui/badge';

interface SetModeStoryProps {
  session: StorySession;
  timer: Timer | null;
  stories: string[];
}

const SetModeStory: React.FC<SetModeStoryProps> = ({ session, timer, stories }) => {
  return (
    <>
      {session.sets.map((set, setIndex) => {
        const isActive = timer && timer.currentSetIndex === setIndex && !timer.isInRest;
        const isCompleted = timer && timer.currentSetIndex > setIndex;
        const storyForSet = stories[setIndex] || '';
        const paragraphs = storyForSet.split(/\n+/).filter(Boolean);
        
        // Calculate progress within this set
        let currentParaIndex = 0;
        if (timer && isActive) {
          const totalIntervalDuration = set.intervals.reduce((sum, interval) => sum + interval.duration, 0);
          let elapsedInSet = 0;
          
          // Add completed intervals in this set
          for (let i = 0; i < timer.currentIntervalIndex; i++) {
            elapsedInSet += set.intervals[i].duration;
          }
          
          // Add progress in current interval if not in pause
          if (!timer.isInPause && timer.currentIntervalIndex < set.intervals.length) {
            const currentInterval = set.intervals[timer.currentIntervalIndex];
            const intervalProgress = 1 - (timer.timeRemaining / currentInterval.duration);
            elapsedInSet += currentInterval.duration * Math.max(0, Math.min(1, intervalProgress));
          }
          
          const setProgress = totalIntervalDuration > 0 ? elapsedInSet / totalIntervalDuration : 0;
          currentParaIndex = Math.min(Math.floor(setProgress * paragraphs.length), paragraphs.length - 1);
        }
        
        return (
          <div 
            key={`set-${setIndex}`} 
            className={cn(
              "mb-8",
              isActive ? "opacity-100" : isCompleted ? "opacity-50" : "opacity-75",
              "transition-opacity duration-300"
            )}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-semibold">Set {setIndex + 1}</h3>
              {isActive && !timer?.isInPause && !timer?.isInRest && (
                <Badge variant="outline" className="animate-pulse">Active</Badge>
              )}
              {isActive && timer?.isInPause && (
                <Badge variant="secondary" className="animate-pulse">Pause</Badge>
              )}
            </div>
            
            {paragraphs.map((paragraph, pIndex) => (
              <p 
                key={`set-${setIndex}-para-${pIndex}`} 
                className={cn(
                  "leading-relaxed mb-4",
                  isActive && pIndex === currentParaIndex && timer?.isRunning && !timer?.isPaused && !timer?.isInPause
                    ? "bg-primary/10 -mx-2 px-2 py-1 rounded transition-colors duration-200 animate-pulse"
                    : isActive && pIndex < currentParaIndex
                      ? "text-muted-foreground"
                      : isCompleted
                        ? "text-muted-foreground"
                        : ""
                )}
              >
                {paragraph}
              </p>
            ))}
          </div>
        );
      })}
    </>
  );
};

export default SetModeStory;
