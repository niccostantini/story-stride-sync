
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
        timeRemaining: totalSeconds
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
        currentInterval: prev.currentInterval === null ? null : 0
      };
    });

    const id = window.setInterval(() => {
      setTimer(prev => {
        if (!prev || !prev.isRunning || prev.isPaused) return prev;
        
        const newTimeRemaining = Math.max(0, prev.timeRemaining - 1);
        
        // Check if we need to move to the next interval
        let newInterval = prev.currentInterval;
        if (prev.currentInterval !== null && session && session.isIntervalMode) {
          const intervalDurationSecs = session.intervalDurationMinutes * 60;
          const intervalsCompleted = Math.floor((session.durationMinutes * 60 - newTimeRemaining) / intervalDurationSecs);
          
          if (intervalsCompleted !== prev.currentInterval) {
            newInterval = intervalsCompleted;
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
        timeRemaining: totalSeconds
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
    
    const minutes = Math.floor(timer.timeRemaining / 60);
    const seconds = timer.timeRemaining % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timer]);

  const getProgress = useCallback(() => {
    if (!timer || !session) return 0;
    
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
