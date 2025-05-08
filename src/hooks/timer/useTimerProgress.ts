
import { useCallback } from 'react';
import { StorySession, Timer } from '@/types';

export const useTimerProgress = (timer: Timer | null, session: StorySession | null) => {
  // Calculate progress for current state (interval, pause, or rest)
  const getProgress = useCallback(() => {
    if (!timer || !session) return 0;
    
    // If in rest period, show rest progress
    if (timer.isInRest) {
      const currentSet = session.sets[Math.max(0, timer.currentSetIndex - 1)];
      const totalRestTime = currentSet?.restAfter || 0;
      if (totalRestTime <= 0) return 0;
      
      return ((totalRestTime - timer.restTimeRemaining) / totalRestTime) * 100;
    }
    
    // If in pause period, show pause progress
    if (timer.isInPause) {
      const currentSet = session.sets[timer.currentSetIndex];
      if (!currentSet || timer.currentIntervalIndex >= currentSet.intervals.length) return 0;
      
      const currentInterval = currentSet.intervals[timer.currentIntervalIndex];
      const totalPauseTime = currentInterval.pauseAfter;
      if (totalPauseTime <= 0) return 0;
      
      return ((totalPauseTime - timer.pauseTimeRemaining) / totalPauseTime) * 100;
    }
    
    // Show interval progress
    const currentSet = session.sets[timer.currentSetIndex];
    if (!currentSet || timer.currentIntervalIndex >= currentSet.intervals.length) return 0;
    
    const currentInterval = currentSet.intervals[timer.currentIntervalIndex];
    const totalIntervalTime = currentInterval.duration;
    if (totalIntervalTime <= 0) return 0;
    
    return ((totalIntervalTime - timer.timeRemaining) / totalIntervalTime) * 100;
  }, [timer, session]);

  // Get current session progress (as a percentage of total time elapsed / total session time)
  const getSessionProgress = useCallback(() => {
    if (!timer || !session) return 0;
    
    // Calculate total session duration
    let totalDuration = 0;
    let elapsedDuration = 0;
    
    session.sets.forEach((set, setIndex) => {
      // Add up all intervals and pauses in this set
      set.intervals.forEach((interval, intervalIndex) => {
        // Add interval duration
        totalDuration += interval.duration;
        
        // Add pause after interval (if not the last interval in the set)
        totalDuration += interval.pauseAfter;
        
        // Calculate elapsed time for this interval
        if (
          (setIndex < timer.currentSetIndex) || 
          (setIndex === timer.currentSetIndex && intervalIndex < timer.currentIntervalIndex)
        ) {
          // Interval is complete
          elapsedDuration += interval.duration + interval.pauseAfter;
        } else if (setIndex === timer.currentSetIndex && intervalIndex === timer.currentIntervalIndex) {
          // Current interval
          if (timer.isInPause) {
            // In pause state
            elapsedDuration += interval.duration + (interval.pauseAfter - timer.pauseTimeRemaining);
          } else {
            // In active interval
            elapsedDuration += (interval.duration - timer.timeRemaining);
          }
        }
      });
      
      // Add rest after set (if not the last set)
      totalDuration += set.restAfter;
      
      // Calculate elapsed time for rest period
      if (
        (setIndex < timer.currentSetIndex - 1) || 
        (setIndex === timer.currentSetIndex - 1 && timer.isInRest === false)
      ) {
        // Rest period is complete
        elapsedDuration += set.restAfter;
      } else if (setIndex === timer.currentSetIndex - 1 && timer.isInRest) {
        // In rest period
        elapsedDuration += (set.restAfter - timer.restTimeRemaining);
      }
    });
    
    return totalDuration > 0 ? (elapsedDuration / totalDuration) * 100 : 0;
  }, [timer, session]);

  return { getProgress, getSessionProgress };
};
