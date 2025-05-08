
import { useState, useEffect, useRef } from 'react';
import { Timer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getSilentAudioUrl, revokeAudioUrl, cleanupAudioUrls } from '@/services/audioUtils';
import { useAudioContent } from './useAudioContent';

/**
 * Hook for managing audio playback session with lifecycle management
 */
export const useAudioSession = (
  audioUrl: string | string[] | null,
  timer: Timer | null
) => {
  const [isLoading, setIsLoading] = useState(true);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const errorRetryCount = useRef<number>(0);
  const maxRetries = 3;
  
  // Use our new audio content management hook
  const { 
    processedUrls, 
    isPreloading, 
    loadingProgress, 
    getUrlForSet 
  } = useAudioContent(audioUrl);
  
  // Get current audio URL based on timer state
  const getCurrentAudioUrl = (): string | null => {
    if (!audioUrl) return null;
    
    // For session-mode audio (single file)
    if (typeof audioUrl === 'string') {
      return processedUrls[0] || null;
    }
    
    // For set-based audio array
    if (Array.isArray(audioUrl) && timer) {
      return getUrlForSet(timer.currentSetIndex);
    }
    
    return null;
  };
  
  // Reset to silent audio for error recovery
  const resetToSilentAudio = () => {
    if (audioRef.current) {
      const silentUrl = getSilentAudioUrl();
      audioRef.current.src = silentUrl;
      audioRef.current.load();
      console.log('Reset to silent audio');
      return silentUrl;
    }
    return null;
  };
  
  // Initialize audio element when component mounts
  useEffect(() => {
    // Create audio element on mount
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      // Default configuration
      audioRef.current.preload = 'auto';
      audioRef.current.crossOrigin = 'anonymous';
      audioRef.current.volume = 1.0;
      
      // Set initial audio to silent audio to prevent errors
      audioRef.current.src = getSilentAudioUrl();
      audioRef.current.load();
    }
    
    // Update loading state based on preloading status
    setIsLoading(isPreloading);
    
    // Clean up on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      
      if (currentAudioUrl && currentAudioUrl.startsWith('blob:')) {
        revokeAudioUrl(currentAudioUrl);
      }
      
      cleanupAudioUrls();
    };
  }, [isPreloading]);
  
  // Update audio source when URL or timer state changes
  useEffect(() => {
    const setupAudio = () => {
      const url = getCurrentAudioUrl();
      
      if (!url) {
        setAudioError("No audio available");
        setIsLoading(false);
        return;
      }
      
      setCurrentAudioUrl(url);
      setIsLoading(true);
      setAudioError(null);
      
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio();
          audioRef.current.preload = 'auto';
          audioRef.current.crossOrigin = 'anonymous';
        }
        
        // Skip if URL is already loaded
        if (audioRef.current.src === url) {
          setIsLoading(false);
          return;
        }
        
        // Update audio source
        audioRef.current.src = url;
        audioRef.current.load();
        audioRef.current.volume = 1.0;
      } catch (error) {
        console.error('Audio setup error:', error);
        setAudioError('Failed to initialize audio');
        setIsLoading(false);
        resetToSilentAudio();
      }
    };
    
    // Only setup audio when we have processed URLs and timer data
    if (processedUrls.length > 0 && timer) {
      setupAudio();
    }
  }, [processedUrls, timer?.currentSetIndex]);
  
  // Clean up URLs when component unmounts
  useEffect(() => {
    return () => {
      if (currentAudioUrl && currentAudioUrl.startsWith('blob:')) {
        revokeAudioUrl(currentAudioUrl);
      }
      cleanupAudioUrls();
    };
  }, [currentAudioUrl]);
  
  return {
    audioRef,
    isLoading,
    setIsLoading,
    audioError,
    setAudioError,
    isMuted,
    setIsMuted,
    currentAudioUrl,
    setCurrentAudioUrl,
    getCurrentAudioUrl,
    resetToSilentAudio,
    errorRetryCount,
    maxRetries,
    loadingProgress
  };
};
