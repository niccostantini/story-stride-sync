import { useEffect } from 'react';
import { Timer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getSilentAudioUrl } from '@/services/audioUtils';

interface UseAudioPlaybackProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  timer: Timer | null;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  audioError: string | null;
  setAudioError: (error: string | null) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  errorRetryCount: React.MutableRefObject<number>;
  maxRetries: number;
  resetToSilentAudio: () => string | null;
  onPlay: () => void;
  onPause: () => void;
  loadingProgress?: number;
}

export const useAudioPlayback = ({
  audioRef,
  timer,
  isLoading,
  setIsLoading,
  audioError,
  setAudioError,
  isMuted,
  setIsMuted,
  errorRetryCount,
  maxRetries,
  resetToSilentAudio,
  onPlay,
  onPause,
  loadingProgress = 0
}: UseAudioPlaybackProps) => {
  const { toast } = useToast();

  // Handle play/pause control with improved error handling
  const handlePlayPause = () => {
    if (!timer) return;
    
    if (timer.isRunning && !timer.isPaused) {
      console.log('Pausing audio and timer');
      onPause();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      console.log('Playing audio and timer');
      setAudioError(null);
      onPlay();
      
      if (audioRef.current && (!timer.isInPause && !timer.isInRest)) {
        tryPlayAudio();
      }
    }
  };
  
  // Helper function to try playing audio with error handling
  const tryPlayAudio = () => {
    if (!audioRef.current) return;
    
    const playPromise = audioRef.current.play();
    
    if (playPromise) {
      playPromise
        .then(() => {
          console.log('Playback started successfully');
          errorRetryCount.current = 0;
        })
        .catch(err => {
          console.error('Playback start error:', err);
          
          // More detailed error handling
          if (err.name === 'NotAllowedError') {
            toast({
              title: "Interaction Required",
              description: "Please click play to enable audio",
              variant: "default",
            });
          } else if (err.name === 'AbortError') {
            // Playback was aborted, likely due to src change - can safely ignore
            console.log('Playback aborted, likely due to src change');
          } else {
            console.warn('Audio playback failed, continuing without audio');
            setAudioError('Audio playback failed - continuing without audio');
          }
        });
    }
  };
  
  // Direct audio play for debugging
  const forcedPlay = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => {
        console.error('Direct play failed:', e);
        toast({
          title: "Playback Error",
          description: "Could not play audio directly: " + e.message,
          variant: "destructive",
        });
      });
    }
  };
  
  // Toggle mute state with improved feedback
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(!audioRef.current.muted);
      
      toast({
        title: audioRef.current.muted ? "Audio Muted" : "Audio Unmuted",
        description: audioRef.current.muted ? "Audio playback is now muted" : "Audio playback is now audible",
      });
    }
  };
  
  // Enhanced debug audio state
  const debugAudio = () => {
    console.log('Audio Debug Information:');
    
    if (audioRef.current) {
      const debugInfo = {
        readyState: audioRef.current.readyState,
        paused: audioRef.current.paused,
        currentTime: audioRef.current.currentTime,
        duration: audioRef.current.duration,
        src: audioRef.current.src.substring(0, 100) + '...',
        muted: audioRef.current.muted,
        volume: audioRef.current.volume,
        loadingProgress: loadingProgress,
        error: audioRef.current.error
      };
      
      console.table(debugInfo);
      
      toast({
        title: "Audio Status",
        description: `Ready: ${debugInfo.readyState}, Loading: ${loadingProgress}%, Paused: ${debugInfo.paused}`,
      });
    } else {
      console.log('Audio element not initialized');
      toast({
        title: "Audio Status",
        description: "Audio element not available",
        variant: "destructive"
      });
    }
  };
  
  // Set up audio event listeners with improved error recovery
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Event handlers
    const handleCanPlay = () => {
      console.log('Audio can play now');
      setIsLoading(false);
      errorRetryCount.current = 0;
      
      // Only show toast if not already playing
      if (!timer?.isRunning) {
        toast({
          title: "Audio ready",
          description: "Your story audio is ready to play",
        });
      }
    };
    
    const handleError = (e: Event) => {
      const error = (e.target as HTMLAudioElement).error;
      console.error('Audio playback error:', error?.code, error?.message);
      
      // Check if we're already playing silent audio to prevent infinite loops
      const audioSrc = audio.src || '';
      const isSilentAudio = audioSrc.includes('data:audio/mp3;base64');
      
      if (isSilentAudio) {
        // If we're already playing silent audio and still getting errors,
        // just continue without audio - don't try to reset again
        console.warn('Error with silent audio, continuing without audio');
        setAudioError('Audio unavailable - story will continue without narration');
        setIsLoading(false);
        return;
      }
      
      // For non-silent audio errors, just show error and continue
      setAudioError(`Audio playback issue - continuing without audio`);
      setIsLoading(false);
      
      console.log('Continuing story without audio due to playback issues');
    };
    
    const handleEnded = () => {
      console.log('Audio playback ended');
      if (timer && timer.isRunning && !timer.isPaused) {
        onPause();
      }
    };
    
    const handleTimeUpdate = () => {
      // Not storing this in state to avoid rerenders
      if (audio.duration > 0) {
        const percent = (audio.currentTime / audio.duration) * 100;
        // Optional: You could emit this to a debug state or logging system
      }
    };
    
    // Register event listeners
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    
    // Cleanup
    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [timer, onPause, toast, resetToSilentAudio]);
  
  // Synchronize audio with timer state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !timer) return;
    
    // Handle audio playback based on timer state
    if (timer.isRunning && !timer.isPaused) {
      if (timer.isInPause || timer.isInRest) {
        audio.pause();
      } else if (!audioError) {
        // Only try to play if there are no errors
        tryPlayAudio();
      }
    } else {
      audio.pause();
    }
  }, [
    timer?.isRunning, 
    timer?.isPaused, 
    timer?.isInPause, 
    timer?.isInRest,
    timer?.currentSetIndex, 
    timer?.currentIntervalIndex,
    audioError
  ]);
  
  // Handle timer reset
  useEffect(() => {
    if (!timer?.isRunning && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [timer?.isRunning]);
  
  return {
    handlePlayPause,
    toggleMute,
    forcedPlay,
    debugAudio
  };
};
