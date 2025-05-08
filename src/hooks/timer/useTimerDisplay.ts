
import { useCallback } from 'react';
import { Timer } from '@/types';

export const useTimerDisplay = (timer: Timer | null) => {
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

  return { formatTimeRemaining };
};
