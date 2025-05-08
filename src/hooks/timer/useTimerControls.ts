import { useCallback } from 'react';
import { StorySession, Timer } from '@/types';

export const useTimerControls = (
  timer: Timer | null,
  session: StorySession | null,
  setTimer: React.Dispatch<React.SetStateAction<Timer | null>>,
  setContextTimer: React.Dispatch<React.SetStateAction<Timer | null>>,
  setIntervalId: React.Dispatch<React.SetStateAction<number | null>>,
  intervalId: number | null,
  moveToNextInterval: () => Timer | null,
  getCurrentInterval: () => any
) => {
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

  return { startTimer, pauseTimer, resumeTimer, resetTimer };
};
