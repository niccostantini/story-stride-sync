
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
  onPause
}: UseAudioPlaybackProps) => {
  const { toast } = useToast();

  // Handle play/pause control
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
        const playPromise = audioRef.current.play();
        if (playPromise) {
          playPromise
            .then(() => {
              console.log('Playback started successfully');
              errorRetryCount.current = 0;
            })
            .catch(err => {
              console.error('Playback start error:', err);
            });
        }
      }
    }
  };
  
  // Direct audio play for debugging
  const forcedPlay = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => {
        console.error('Direct play failed:', e);
        toast({
          title: "Playback Error",
          description: "Could not play audio directly",
          variant: "destructive",
        });
      });
    }
  };
  
  // Toggle mute state
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(!isMuted);
      
      toast({
        title: audioRef.current.muted ? "Audio Muted" : "Audio Unmuted",
        description: audioRef.current.muted ? "Audio playback is now muted" : "Audio playback is now audible",
      });
    }
  };
  
  // Debug audio state
  const debugAudio = () => {
    console.log('Audio Debug Information:');
    
    if (audioRef.current) {
      const debugInfo = {
        readyState: audioRef.current.readyState,
        paused: audioRef.current.paused,
        currentTime: audioRef.current.currentTime,
        duration: audioRef.current.duration,
        src: audioRef.current.src,
        muted: audioRef.current.muted,
        volume: audioRef.current.volume
      };
      
      console.table(debugInfo);
      
      toast({
        title: "Audio Status",
        description: `Ready: ${debugInfo.readyState}, Paused: ${debugInfo.paused}`,
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
  
  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Event handlers
    const handleCanPlay = () => {
      console.log('Audio can play now');
      setIsLoading(false);
      errorRetryCount.current = 0;
      
      if (!timer?.isRunning) {
        toast({
          title: "Audio ready",
          description: "Your story audio is ready to play",
        });
      }
    };
    
    const handleError = (e: Event) => {
      const error = (e.target as HTMLAudioElement).error;
      console.error('Audio playback error:', error);
      
      errorRetryCount.current++;
      
      if (errorRetryCount.current >= maxRetries) {
        setAudioError(`Audio error: ${error?.message || 'Unknown error'}`);
        setIsLoading(false);
        
        toast({
          title: "Audio Error",
          description: `Playback error: ${error?.message || 'Unknown error'}`,
          variant: "destructive",
        });
        
        resetToSilentAudio();
      } else {
        console.log(`Audio error #${errorRetryCount.current}, trying silent audio`);
        resetToSilentAudio();
      }
    };
    
    const handleEnded = () => {
      console.log('Audio playback ended');
      if (timer && timer.isRunning && !timer.isPaused) {
        onPause();
      }
    };
    
    // Register event listeners
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);
    
    // Cleanup
    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [timer, onPause, toast, resetToSilentAudio]);
  
  // Synchronize audio with timer state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !timer) return;
    
    // Handle normal play/pause based on timer
    if (timer.isRunning && !timer.isPaused) {
      if (timer.isInPause || timer.isInRest) {
        audio.pause();
      } else {
        if (audioError) return;
        
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn('Non-critical playback error:', error);
            
            if (error.name === 'NotAllowedError') {
              toast({
                title: "Tap to play",
                description: "Please tap play to start audio",
                variant: "default",
              });
            }
          });
        }
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
    audioError,
    toast
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
