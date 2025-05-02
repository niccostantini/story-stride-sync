
import { useState, useEffect, useCallback } from 'react';
import { StorySession, Timer } from '@/types';
import { useStory } from '@/context/StoryContext';

export const useStoryTimer = (session: StorySession | null) => {
  const { setTimer: setContextTimer } = useStory();
  const [timer, setTimer] = useState<Timer | null>(null);
  const [intervalId, setIntervalId] = useState<number | null>(null);

  // Initialize timer when a session is provided
  useEffect(() => {
    if (session) {
      const totalSeconds = session.durationMinutes * 60;
      
      const newTimer = {
        sessionId: session.id,
        startTime: null,
        endTime: null,
        currentInterval: session.isIntervalMode ? 0 : null,
        isRunning: false,
        isPaused: false,
        timeRemaining: totalSeconds,
        isInPause: false,
        pauseTimeRemaining: session.pauseDurationSeconds
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

  const startTimer = useCallback(() => {
    if (!timer) return;
    
    const updatedTimer = {
      ...timer,
      startTime: new Date(),
      endTime: new Date(Date.now() + timer.timeRemaining * 1000),
      isRunning: true,
      isPaused: false,
      currentInterval: timer.currentInterval === null ? null : 0,
      isInPause: false
    };
    
    setTimer(updatedTimer);
    setContextTimer(updatedTimer);

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
            const updatedTimer = {
              ...prev,
              isInPause: false,
              pauseTimeRemaining: session.pauseDurationSeconds,
              currentInterval: nextInterval >= session.intervalCount ? prev.currentInterval : nextInterval
            };
            setContextTimer(updatedTimer);
            return updatedTimer;
          }
          
          const updatedTimer = {
            ...prev,
            pauseTimeRemaining: newPauseTimeRemaining
          };
          setContextTimer(updatedTimer);
          return updatedTimer;
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
            const updatedTimer = {
              ...prev,
              timeRemaining: newTimeRemaining,
              isInPause: true,
              pauseTimeRemaining: session.pauseDurationSeconds
            };
            setContextTimer(updatedTimer);
            return updatedTimer;
          }
        }
        
        // Check if timer is completed
        if (newTimeRemaining === 0) {
          clearInterval(intervalId!);
          const updatedTimer = {
            ...prev,
            isRunning: false,
            timeRemaining: 0,
            endTime: new Date()
          };
          setContextTimer(updatedTimer);
          return updatedTimer;
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
        
        const updatedTimer = {
          ...prev,
          timeRemaining: newTimeRemaining,
          currentInterval: newInterval
        };
        setContextTimer(updatedTimer);
        return updatedTimer;
      });
    }, 1000);
    
    setIntervalId(id);
  }, [timer, intervalId, session, setContextTimer]);

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
      isPaused: false,
      endTime: new Date(Date.now() + timer.timeRemaining * 1000)
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
      const totalSeconds = session.durationMinutes * 60;
      
      const updatedTimer = {
        sessionId: session.id,
        startTime: null,
        endTime: null,
        currentInterval: session.isIntervalMode ? 0 : null,
        isRunning: false,
        isPaused: false,
        timeRemaining: totalSeconds,
        isInPause: false,
        pauseTimeRemaining: session.pauseDurationSeconds
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
