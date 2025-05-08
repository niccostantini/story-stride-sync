
import React from 'react';
import { cn } from '@/lib/utils';
import { StorySession, Timer } from '@/types';
import { Badge } from '@/components/ui/badge';

interface IntervalModeStoryProps {
  session: StorySession;
  timer: Timer | null;
  stories: string[];
}

const IntervalModeStory: React.FC<IntervalModeStoryProps> = ({ session, timer, stories }) => {
  return (
    <>
      {session.sets.map((set, setIndex) => {
        const isActiveSet = timer && timer.currentSetIndex === setIndex;
        const isCompletedSet = timer && timer.currentSetIndex > setIndex;
        let storyIndex = 0;
        
        // Calculate the starting story index for this set
        if (setIndex > 0) {
          for (let i = 0; i < setIndex; i++) {
            storyIndex += session.sets[i].intervals.length;
          }
        }
        
        return (
          <div key={`set-${setIndex}`} className="mb-8">
            <h3 className="text-xl font-semibold mb-2">Set {setIndex + 1}</h3>
            
            {set.intervals.map((interval, intervalIndex) => {
              const currentStoryIndex = storyIndex + intervalIndex;
              const intervalStory = stories[currentStoryIndex] || '';
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
      })}
    </>
  );
};

export default IntervalModeStory;
