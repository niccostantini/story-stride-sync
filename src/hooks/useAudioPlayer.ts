import { useState, useEffect, useRef } from 'react';
import { Timer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getSilentAudioUrl } from '@/services/audioUtils';

export const useAudioPlayer = (
  audioUrl: string | string[] | null,
  timer: Timer | null,
  onPlay: () => void,
  onPause: () => void
) => {
  const [isLoading, setIsLoading] = useState(true);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  
  // Debug function to check audio element and URL
  const debugAudio = () => {
    console.log('Debug Audio Status:');
    console.log('- Audio URL:', audioUrl);
    console.log('- Audio element exists:', !!audioRef.current);
    
    if (audioRef.current) {
      console.log('- Audio element properties:');
      console.log('  - readyState:', audioRef.current.readyState);
      console.log('  - paused:', audioRef.current.paused);
      console.log('  - currentTime:', audioRef.current.currentTime);
      console.log('  - duration:', audioRef.current.duration);
      console.log('  - src:', audioRef.current.src);
      
      // Use a safe silent audio URL as fallback
      const safeAudioUrl = getSilentAudioUrl();
      
      // Create a download link for the audio
      const blob = new Blob([''], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'story-audio.mp3';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast({
        title: "Audio Download",
        description: "Audio file downloaded (silent placeholder)",
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
      
      // If there was an error, try to reload the audio before playing
      if (audioError && audioRef.current) {
        const currentUrl = getCurrentAudioUrl();
        if (currentUrl) {
          setAudioError(null);
          setIsLoading(true);
          audioRef.current.src = currentUrl;
          audioRef.current.load();
        }
      }
      
      onPlay(); // Start the timer first
      
      // Only try to play audio if we're not in a pause or rest period
      if (audioRef.current && (!timer.isInPause && !timer.isInRest)) {
        const playPromise = audioRef.current.play();
        if (playPromise) {
          playPromise
            .then(() => {
              console.log('Audio playback started successfully');
            })
            .catch(err => {
              console.error('Failed to start audio playback:', err);
              // Even if audio fails, keep timer running
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
    }
  };
  
  // Force play (for development testing)
  const forcedPlay = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.error('Direct play failed:', e));
    }
  };

  return {
    isLoading,
    setIsLoading,
    audioError,
    setAudioError,
    isMuted,
    audioRef,
    getCurrentAudioUrl,
    handlePlayPause,
    toggleMute,
    debugAudio,
    forcedPlay,
  };
};
