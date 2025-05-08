
import { useCallback } from 'react';
import { StorySession, Timer } from '@/types';

export const useTimerNavigation = (
  session: StorySession | null, 
  timer: Timer | null
) => {
  // Helper function to get current interval
  const getCurrentInterval = useCallback(() => {
    if (!session || !timer) return null;
    
    if (timer.currentSetIndex >= session.sets.length) return null;
    
    const currentSet = session.sets[timer.currentSetIndex];
    
    if (timer.currentIntervalIndex >= currentSet.intervals.length) return null;
    
    return currentSet.intervals[timer.currentIntervalIndex];
  }, [session, timer]);

  // Helper function to move to next interval or set
  const moveToNextInterval = useCallback(() => {
    if (!session || !timer) return null;
    
    const currentSet = session.sets[timer.currentSetIndex];
    
    // Check if we need to move to the next interval in the same set
    if (timer.currentIntervalIndex < currentSet.intervals.length - 1) {
      const nextIntervalIndex = timer.currentIntervalIndex + 1;
      const nextInterval = currentSet.intervals[nextIntervalIndex];
      
      return {
        ...timer,
        currentIntervalIndex: nextIntervalIndex,
        timeRemaining: nextInterval.duration,
        isInPause: false,
        pauseTimeRemaining: nextInterval.pauseAfter
      };
    }
    
    // Check if we need to move to the next set
    if (timer.currentSetIndex < session.sets.length - 1) {
      const nextSetIndex = timer.currentSetIndex + 1;
      const nextSet = session.sets[nextSetIndex];
      
      // Start rest period between sets
      return {
        ...timer,
        currentSetIndex: nextSetIndex,
        currentIntervalIndex: 0,
        timeRemaining: nextSet.intervals[0].duration,
        isInPause: false,
        pauseTimeRemaining: nextSet.intervals[0].pauseAfter,
        isInRest: currentSet.restAfter > 0, // Only enter rest state if rest duration is > 0
        restTimeRemaining: currentSet.restAfter
      };
    }
    
    // Session complete
    return {
      ...timer,
      isRunning: false,
      timeRemaining: 0,
      endTime: new Date()
    };
  }, [session, timer]);

  return { getCurrentInterval, moveToNextInterval };
};
