
import { useState, useEffect, useCallback } from 'react';
import { StorySession, Timer } from '@/types';
import { useStory } from '@/context/StoryContext';
import { useTimerControls } from './timer/useTimerControls';
import { useTimerDisplay } from './timer/useTimerDisplay';
import { useTimerProgress } from './timer/useTimerProgress';
import { useTimerNavigation } from './timer/useTimerNavigation';

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

  // Import timer control hooks
  const { moveToNextInterval, getCurrentInterval } = useTimerNavigation(session, timer);
  const { startTimer, pauseTimer, resumeTimer, resetTimer } = useTimerControls(
    timer,
    session,
    setTimer,
    setContextTimer,
    setIntervalId,
    intervalId,
    moveToNextInterval,
    getCurrentInterval
  );
  const { formatTimeRemaining } = useTimerDisplay(timer);
  const { getProgress, getSessionProgress } = useTimerProgress(timer, session);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [intervalId]);

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
