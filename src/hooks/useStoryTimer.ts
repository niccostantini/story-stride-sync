import { useState, useEffect, useCallback } from 'react';
import { StorySession, Timer, WorkoutSet } from '@/types';
import { useStory } from '@/context/StoryContext';

export const useStoryTimer = (session: StorySession | null) => {
  const { setTimer: setContextTimer } = useStory();
  const [timer, setTimer] = useState<Timer | null>(null);
  const [intervalId, setIntervalId] = useState<number | null>(null);

  // Initialize timer when a session is provided
  useEffect(() => {
    if (session) {
      // Get the first interval duration
      const firstInterval = session.sets[0]?.intervals[0];
      const initialTimeRemaining = firstInterval ? firstInterval.duration : 60;
      
      const newTimer: Timer = {
        sessionId: session.id,
        startTime: null,
        endTime: null,
        currentSetIndex: 0,
        currentIntervalIndex: 0,
        isRunning: false,
        isPaused: false,
        timeRemaining: initialTimeRemaining,
        isInPause: false,
        pauseTimeRemaining: firstInterval ? firstInterval.pauseAfter : 0,
        isInRest: false,
        restTimeRemaining: session.sets[0]?.restAfter || 0
      };
      
      setTimer(newTimer);
      setContextTimer(newTimer);
    } else {
      setTimer(null);
      setContextTimer(null);
      if (intervalId) {
        window.clearInterval(intervalId);
        setIntervalId(null);
      }
    }
  }, [session, intervalId, setContextTimer]);

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

  const startTimer = useCallback(() => {
    if (!timer || !session) return;
    
    const updatedTimer = {
      ...timer,
      startTime: timer.startTime || new Date(),
      isRunning: true,
      isPaused: false
    };
    
    setTimer(updatedTimer);
    setContextTimer(updatedTimer);

    const id = window.setInterval(() => {
      setTimer(prev => {
        if (!prev || !prev.isRunning || prev.isPaused || !session) return prev;
        
        // Handle rest period between sets
        if (prev.isInRest) {
          const newRestTimeRemaining = Math.max(0, prev.restTimeRemaining - 1);
          
          // Check if rest period is complete
          if (newRestTimeRemaining === 0) {
            // Move to the first interval of the next set
            const updatedTimer = {
              ...prev,
              isInRest: false,
              restTimeRemaining: 0,
              // currentSetIndex is already updated when entering rest state
            };
            
            setContextTimer(updatedTimer);
            return updatedTimer;
          }
          
          const updatedTimer = {
            ...prev,
            restTimeRemaining: newRestTimeRemaining
          };
          
          setContextTimer(updatedTimer);
          return updatedTimer;
        }
        
        // Handle pause between intervals
        if (prev.isInPause) {
          const newPauseTimeRemaining = Math.max(0, prev.pauseTimeRemaining - 1);
          
          // Check if pause is complete
          if (newPauseTimeRemaining === 0) {
            // Move to the next interval or set
            const nextTimer = moveToNextInterval();
            if (nextTimer) {
              setContextTimer(nextTimer);
              return nextTimer;
            }
          }
          
          const updatedTimer = {
            ...prev,
            pauseTimeRemaining: newPauseTimeRemaining
          };
          
          setContextTimer(updatedTimer);
          return updatedTimer;
        }
        
        // Handle regular interval timing
        const newTimeRemaining = Math.max(0, prev.timeRemaining - 1);
        
        // Check if interval is complete
        if (newTimeRemaining === 0) {
          const currentInterval = getCurrentInterval();
          
          // If there's a pause after this interval, enter pause state
          if (currentInterval && currentInterval.pauseAfter > 0) {
            const updatedTimer = {
              ...prev,
              timeRemaining: 0,
              isInPause: true,
              pauseTimeRemaining: currentInterval.pauseAfter
            };
            
            setContextTimer(updatedTimer);
            return updatedTimer;
          }
          
          // Otherwise, move to next interval or set
          const nextTimer = moveToNextInterval();
          if (nextTimer) {
            setContextTimer(nextTimer);
            return nextTimer;
          }
        }
        
        // Continue current interval
        const updatedTimer = {
          ...prev,
          timeRemaining: newTimeRemaining
        };
        
        setContextTimer(updatedTimer);
        return updatedTimer;
      });
    }, 1000);
    
    setIntervalId(id);
  }, [timer, session, moveToNextInterval, getCurrentInterval, setContextTimer]);

  const pauseTimer = useCallback(() => {
    if (!timer || !timer.isRunning || timer.isPaused) return;
    
    const updatedTimer = { ...timer, isPaused: true };
    setTimer(updatedTimer);
    setContextTimer(updatedTimer);
  }, [timer, setContextTimer]);

  const resumeTimer = useCallback(() => {
    if (!timer || !timer.isRunning || !timer.isPaused) return;
    
    const updatedTimer = { 
      ...timer, 
      isPaused: false
    };
    setTimer(updatedTimer);
    setContextTimer(updatedTimer);
  }, [timer, setContextTimer]);

  const resetTimer = useCallback(() => {
    if (intervalId) {
      window.clearInterval(intervalId);
      setIntervalId(null);
    }
    
    if (session) {
      const firstInterval = session.sets[0]?.intervals[0];
      const initialTimeRemaining = firstInterval ? firstInterval.duration : 60;
      
      const updatedTimer: Timer = {
        sessionId: session.id,
        startTime: null,
        endTime: null,
        currentSetIndex: 0,
        currentIntervalIndex: 0,
        isRunning: false,
        isPaused: false,
        timeRemaining: initialTimeRemaining,
        isInPause: false,
        pauseTimeRemaining: firstInterval ? firstInterval.pauseAfter : 0,
        isInRest: false,
        restTimeRemaining: session.sets[0]?.restAfter || 0
      };
      
      setTimer(updatedTimer);
      setContextTimer(updatedTimer);
    }
  }, [session, intervalId, setContextTimer]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  // Format time for display
  const formatTimeRemaining = useCallback(() => {
    if (!timer) return '00:00';
    
    // If in rest period, show rest time
    if (timer.isInRest) {
      const minutes = Math.floor(timer.restTimeRemaining / 60);
      const seconds = timer.restTimeRemaining % 60;
      return `Rest: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // If in pause, show pause time
    if (timer.isInPause) {
      const minutes = Math.floor(timer.pauseTimeRemaining / 60);
      const seconds = timer.pauseTimeRemaining % 60;
      return `Pause: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Show interval time
    const minutes = Math.floor(timer.timeRemaining / 60);
    const seconds = timer.timeRemaining % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timer]);

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

  return { 
    timer, 
    startTimer, 
    pauseTimer, 
    resumeTimer, 
    resetTimer, 
    formatTimeRemaining,
    getProgress,
    getSessionProgress
  };
};
