
import { useState, useRef } from 'react';
import { Timer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getSilentAudioUrl, revokeAudioUrl, cleanupAudioUrls } from '@/services/audioUtils';

// This hook is deprecated and will be removed in a future update.
// Please use useAudioSession and useAudioPlayback hooks instead.
export const useAudioPlayer = (
  audioUrl: string | string[] | null,
  timer: Timer | null,
  onPlay: () => void,
  onPause: () => void
) => {
  console.warn('useAudioPlayer is deprecated - use useAudioSession and useAudioPlayback instead');
  
  const [isLoading, setIsLoading] = useState(true);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const errorRetryCount = useRef<number>(0);
  const { toast } = useToast();
  
  // Debug function to check audio element and URL
  const debugAudio = () => {
    console.log('Debug Audio Status:');
    console.log('- Audio URL:', currentAudioUrl);
    console.log('- Audio element exists:', !!audioRef.current);
    
    if (audioRef.current) {
      console.log('- Audio element properties:');
      console.log('  - readyState:', audioRef.current.readyState);
      console.log('  - paused:', audioRef.current.paused);
      console.log('  - currentTime:', audioRef.current.currentTime);
      console.log('  - duration:', audioRef.current.duration);
      console.log('  - src:', audioRef.current.src);
      
      toast({
        title: "Audio Status",
        description: `Ready state: ${audioRef.current.readyState}, Paused: ${audioRef.current.paused}`,
      });
    }
  };
  
  // Get current audio URL based on timer state and story mode
  const getCurrentAudioUrl = (): string | null => {
    if (!audioUrl) return null;
    
    // If audioUrl is a string, it's a session-mode audio file
    if (typeof audioUrl === 'string') {
      return audioUrl;
    }
    
    // If audioUrl is an array, it depends on the current set or interval
    if (Array.isArray(audioUrl) && timer) {
      const index = Math.min(timer.currentSetIndex, audioUrl.length - 1);
      return audioUrl[index] || null;
    }
    
    return null;
  };
  
  // Reset audio with a silent track
  const resetToSilentAudio = () => {
    if (audioRef.current) {
      const silentUrl = getSilentAudioUrl();
      audioRef.current.src = silentUrl;
      audioRef.current.load();
      return silentUrl;
    }
    return null;
  };
  
  // Handle play/pause toggle
  const handlePlayPause = () => {
    if (!timer) return;
    
    if (timer.isRunning && !timer.isPaused) {
      console.log('Pause button clicked: pausing audio and timer');
      onPause();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      console.log('Play button clicked: starting audio and timer');
      
      // Reset error state when manually playing
      setAudioError(null);
      
      // Start the timer first
      onPlay();
      
      // Only try to play audio if we're not in a pause or rest period
      if (audioRef.current && (!timer.isInPause && !timer.isInRest)) {
        // Make sure we have the latest audio URL
        const url = getCurrentAudioUrl();
        if (url && url !== audioRef.current.src) {
          audioRef.current.src = url;
          audioRef.current.load();
        }
        
        const playPromise = audioRef.current.play();
        if (playPromise) {
          playPromise
            .then(() => {
              console.log('Audio playback started successfully');
              errorRetryCount.current = 0; // Reset retry counter on success
            })
            .catch(err => {
              console.error('Failed to start audio playback:', err);
              // Don't set error state here to avoid stopping the timer
              // Silent failure is better than breaking the workout
            });
        }
      }
    }
  };
  
  // Toggle mute
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
  
  // Force play (for testing)
  const forcedPlay = () => {
    if (audioRef.current) {
      // Reset the src to ensure we're working with the most recent URL
      const url = getCurrentAudioUrl() || getSilentAudioUrl();
      audioRef.current.src = url;
      audioRef.current.load();
      
      audioRef.current.play().catch(e => {
        console.error('Direct play failed:', e);
        toast({
          title: "Playback Error",
          description: "Could not play audio directly. Try clicking the regular play button.",
          variant: "destructive",
        });
      });
    }
  };

  return {
    isLoading,
    setIsLoading,
    audioError,
    setAudioError,
    isMuted,
    audioRef,
    currentAudioUrl,
    setCurrentAudioUrl,
    getCurrentAudioUrl,
    resetToSilentAudio,
    handlePlayPause,
    toggleMute,
    debugAudio,
    forcedPlay,
  };
};
