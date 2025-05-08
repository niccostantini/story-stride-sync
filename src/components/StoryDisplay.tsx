
import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StorySession, Timer } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface StoryDisplayProps {
  session: StorySession;
  timer: Timer | null;
}

const StoryDisplay: React.FC<StoryDisplayProps> = ({ session, timer }) => {
  const storyTextRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Format story text based on the session structure and timer state
  const renderStoryText = () => {
    if (!session.storyText) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      );
    }
    
    // For session mode (one continuous story)
    if (session.storyMode === "session") {
      const text = typeof session.storyText === 'string' ? session.storyText : session.storyText.join("\n\n");
      const paragraphs = text.split(/\n+/).filter(Boolean);
      
      // Calculate total paragraphs across all sets
      const totalDuration = session.sets.reduce((total, set) => {
        return total + set.intervals.reduce((sum, interval) => sum + interval.duration, 0);
      }, 0);
      
      // Calculate elapsed exercise time (not counting pauses or rests)
      const calculateExerciseTimeElapsed = () => {
        if (!timer) return 0;
        
        // Sum up completed intervals durations
        let elapsed = 0;
        
        // Add completed sets
        for (let i = 0; i < timer.currentSetIndex; i++) {
          elapsed += session.sets[i].intervals.reduce((sum, interval) => sum + interval.duration, 0);
        }
        
        // Add completed intervals in current set
        if (timer.currentSetIndex < session.sets.length) {
          const currentSet = session.sets[timer.currentSetIndex];
          for (let i = 0; i < timer.currentIntervalIndex; i++) {
            elapsed += currentSet.intervals[i].duration;
          }
        }
        
        // Add elapsed time in current interval if not in pause/rest
        if (!timer.isInPause && !timer.isInRest && timer.currentSetIndex < session.sets.length && 
            timer.currentIntervalIndex < session.sets[timer.currentSetIndex].intervals.length) {
          const currentInterval = session.sets[timer.currentSetIndex].intervals[timer.currentIntervalIndex];
          const intervalProgress = 1 - (timer.timeRemaining / currentInterval.duration);
          elapsed += currentInterval.duration * Math.max(0, Math.min(1, intervalProgress));
        }
        
        return elapsed;
      };
      
      // Calculate reading progress
      const progress = totalDuration > 0 ? calculateExerciseTimeElapsed() / totalDuration : 0;
      const currentParaIndex = Math.min(Math.floor(progress * paragraphs.length), paragraphs.length - 1);
      
      return paragraphs.map((paragraph, index) => (
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
      ));
    }
    
    // For set mode (one story per set)
    if (session.storyMode === "set") {
      const stories = Array.isArray(session.storyText) ? session.storyText : [session.storyText];
      
      return session.sets.map((set, setIndex) => {
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
      });
    }
    
    // For interval mode (one story per interval)
    if (session.storyMode === "interval") {
      // Flatten the stories array if it's an array of strings
      const allStories = Array.isArray(session.storyText) ? session.storyText : [session.storyText];
      let storyIndex = 0;
      
      return session.sets.map((set, setIndex) => {
        const isActiveSet = timer && timer.currentSetIndex === setIndex;
        const isCompletedSet = timer && timer.currentSetIndex > setIndex;
        
        return (
          <div key={`set-${setIndex}`} className="mb-8">
            <h3 className="text-xl font-semibold mb-2">Set {setIndex + 1}</h3>
            
            {set.intervals.map((interval, intervalIndex) => {
              const intervalStory = allStories[storyIndex++] || '';
              const isActiveInterval = isActiveSet && timer && timer.currentIntervalIndex === intervalIndex;
              const isCompletedInterval = isCompletedSet || (isActiveSet && timer && timer.currentIntervalIndex > intervalIndex);
              
              return (
                <div 
                  key={`set-${setIndex}-interval-${intervalIndex}`}
                  className={cn(
                    "mb-4 p-3 border rounded",
                    isActiveInterval ? "border-primary" : "border-muted",
                    isCompletedInterval ? "opacity-50" : "opacity-100"
                  )}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{interval.label}</h4>
                    {isActiveInterval && !timer?.isInPause && !timer?.isInRest && (
                      <Badge variant="outline" className="animate-pulse">Active</Badge>
                    )}
                  </div>
                  <p className="text-sm">{intervalStory}</p>
                </div>
              );
            })}
          </div>
        );
      });
    }
    
    return null;
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="py-4">
        <h3 className="text-xl font-semibold mb-2">Your Story</h3>
        <ScrollArea 
          className="h-[300px] rounded-md border p-4"
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
