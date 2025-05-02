
import { useState, useEffect, useCallback } from 'react';
import { StorySession, Timer } from '../types';

export const useTimer = (session: StorySession | null) => {
  const [timer, setTimer] = useState<Timer | null>(null);
  const [intervalId, setIntervalId] = useState<number | null>(null);

  // Initialize timer when a session is provided
  useEffect(() => {
    if (session) {
      const totalSeconds = session.durationMinutes * 60;
      
      setTimer({
        sessionId: session.id,
        startTime: null,
        endTime: null,
        currentInterval: session.isIntervalMode ? 0 : null,
        isRunning: false,
        isPaused: false,
        timeRemaining: totalSeconds,
        isInPause: false,
        pauseTimeRemaining: session.pauseDurationSeconds
      });
    } else {
      setTimer(null);
      if (intervalId) {
        window.clearInterval(intervalId);
        setIntervalId(null);
      }
    }
  }, [session, intervalId]);

  const startTimer = useCallback(() => {
    if (!timer) return;
    
    setTimer(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        startTime: new Date(),
        endTime: new Date(Date.now() + prev.timeRemaining * 1000),
        isRunning: true,
        isPaused: false,
        currentInterval: prev.currentInterval === null ? null : 0,
        isInPause: false
      };
    });

    const id = window.setInterval(() => {
      setTimer(prev => {
        if (!prev || !prev.isRunning || prev.isPaused) return prev;
        
        // Handle pause between intervals
        if (prev.isInPause) {
          const newPauseTimeRemaining = Math.max(0, prev.pauseTimeRemaining - 1);
          
          // Check if pause is complete
          if (newPauseTimeRemaining === 0 && session) {
            // Move to the next interval
            const nextInterval = (prev.currentInterval || 0) + 1;
            
            return {
              ...prev,
              isInPause: false,
              pauseTimeRemaining: session.pauseDurationSeconds,
              currentInterval: nextInterval >= session.intervalCount ? prev.currentInterval : nextInterval
            };
          }
          
          return {
            ...prev,
            pauseTimeRemaining: newPauseTimeRemaining
          };
        }
        
        // Handle regular timer
        const newTimeRemaining = Math.max(0, prev.timeRemaining - 1);
        
        // Check if we need to move to a pause
        if (session && session.isIntervalMode && prev.currentInterval !== null) {
          const intervalDurationSecs = session.intervalDurationMinutes * 60;
          const currentIntervalTotalSecs = intervalDurationSecs * (prev.currentInterval + 1);
          const remainingTotalSecs = session.durationMinutes * 60 - newTimeRemaining;
          
          // If we've completed the current interval but not the last one
          if (remainingTotalSecs >= currentIntervalTotalSecs && 
              prev.currentInterval < session.intervalCount - 1 && 
              !prev.isInPause && 
              session.pauseDurationSeconds > 0) {
            
            // Start a pause
            return {
              ...prev,
              timeRemaining: newTimeRemaining,
              isInPause: true,
              pauseTimeRemaining: session.pauseDurationSeconds
            };
          }
        }
        
        // Check if timer is completed
        if (newTimeRemaining === 0) {
          clearInterval(intervalId!);
          return {
            ...prev,
            isRunning: false,
            timeRemaining: 0,
            endTime: new Date()
          };
        }
        
        // Update current interval if needed but not in pause
        let newInterval = prev.currentInterval;
        if (!prev.isInPause && prev.currentInterval !== null && session && session.isIntervalMode) {
          const intervalDurationSecs = session.intervalDurationMinutes * 60;
          // Calculate total workout time including pauses
          const totalPauseDuration = ((prev.currentInterval) * session.pauseDurationSeconds);
          // Subtract pause durations to get actual workout time
          const workoutTimeElapsed = ((session.durationMinutes * 60) - newTimeRemaining) - totalPauseDuration;
          const currentInterval = Math.min(
            Math.floor(workoutTimeElapsed / intervalDurationSecs),
            session.intervalCount - 1
          );
          
          if (currentInterval !== prev.currentInterval) {
            newInterval = currentInterval;
          }
        }
        
        return {
          ...prev,
          timeRemaining: newTimeRemaining,
          currentInterval: newInterval
        };
      });
    }, 1000);
    
    setIntervalId(id);
  }, [timer, intervalId, session]);

  const pauseTimer = useCallback(() => {
    if (!timer || !timer.isRunning || timer.isPaused) return;
    
    setTimer(prev => {
      if (!prev) return null;
      return { ...prev, isPaused: true };
    });
  }, [timer]);

  const resumeTimer = useCallback(() => {
    if (!timer || !timer.isRunning || !timer.isPaused) return;
    
    setTimer(prev => {
      if (!prev) return null;
      return { 
        ...prev, 
        isPaused: false,
        endTime: new Date(Date.now() + prev.timeRemaining * 1000)
      };
    });
  }, [timer]);

  const resetTimer = useCallback(() => {
    if (intervalId) {
      window.clearInterval(intervalId);
      setIntervalId(null);
    }
    
    if (session) {
      const totalSeconds = session.durationMinutes * 60;
      
      setTimer({
        sessionId: session.id,
        startTime: null,
        endTime: null,
        currentInterval: session.isIntervalMode ? 0 : null,
        isRunning: false,
        isPaused: false,
        timeRemaining: totalSeconds,
        isInPause: false,
        pauseTimeRemaining: session.pauseDurationSeconds
      });
    }
  }, [session, intervalId]);

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
    
    // If in pause, show pause time instead
    if (timer.isInPause) {
      const seconds = timer.pauseTimeRemaining;
      return `Pause: ${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    
    const minutes = Math.floor(timer.timeRemaining / 60);
    const seconds = timer.timeRemaining % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timer]);

  const getProgress = useCallback(() => {
    if (!timer || !session) return 0;
    
    // If in pause mode, show progress of the pause
    if (timer.isInPause) {
      return ((session.pauseDurationSeconds - timer.pauseTimeRemaining) / session.pauseDurationSeconds) * 100;
    }
    
    const totalSeconds = session.durationMinutes * 60;
    const elapsedSeconds = totalSeconds - timer.timeRemaining;
    
    return (elapsedSeconds / totalSeconds) * 100;
  }, [timer, session]);

  return { 
    timer, 
    startTimer, 
    pauseTimer, 
    resumeTimer, 
    resetTimer, 
    formatTimeRemaining,
    getProgress
  };
};
