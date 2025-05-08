
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
  const silentAudioAttempts = useRef<number>(0);
  const maxRetries = 3;
  const maxSilentAudioAttempts = 2; // Limit silent audio reset attempts
  
  // Use our audio content management hook
  const { 
    processedUrls, 
    isPreloading, 
    loadingProgress, 
    getUrlForSet 
  } = useAudioContent(audioUrl);
  
  // Get current audio URL based on timer state
  const getCurrentAudioUrl = (): string | null => {
    if (!processedUrls.length) return getSilentAudioUrl();
    
    // For session-mode audio (single file)
    if (processedUrls.length === 1) return processedUrls[0];
    
    // For set-based audio array
    if (timer) {
      return getUrlForSet(timer.currentSetIndex);
    }
    
    return processedUrls[0]; // Default to first audio if no timer
  };
  
  // Reset to silent audio for error recovery
  const resetToSilentAudio = () => {
    if (audioRef.current) {
      // Check if we're already playing silent audio
      const currentSrc = audioRef.current.src || '';
      const silentUrl = getSilentAudioUrl();
      
      // Prevent infinite loops by limiting silent audio attempts
      if (currentSrc === silentUrl) {
        silentAudioAttempts.current++;
        
        if (silentAudioAttempts.current > maxSilentAudioAttempts) {
          console.warn(`Reached max silent audio attempts (${maxSilentAudioAttempts}), stopping reset attempts`);
          return null;
        }
      } else {
        // Reset counter when switching to silent audio from a different source
        silentAudioAttempts.current = 0;
      }
      
      console.log(`Resetting to silent audio (attempt ${silentAudioAttempts.current + 1}/${maxSilentAudioAttempts + 1})`);
      
      try {
        // Properly clean up the current audio
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
        
        // Set new silent audio source
        audioRef.current.src = silentUrl;
        audioRef.current.load();
        return silentUrl;
      } catch (err) {
        console.error("Error when resetting to silent audio:", err);
        return null;
      }
    }
    return null;
  };
  
  // Initialize audio element when component mounts
  useEffect(() => {
    // Create audio element on mount if it doesn't exist
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
    if (!processedUrls.length) return;
    
    const setupAudio = () => {
      const url = getCurrentAudioUrl();
      
      if (!url) {
        setAudioError("No audio available");
        setIsLoading(false);
        return;
      }
      
      // Don't change the audio source if it's already loaded
      if (audioRef.current && audioRef.current.src === url && !audioRef.current.error) {
        setIsLoading(false);
        return;
      }
      
      console.log('Setting up audio with URL:', url);
      setCurrentAudioUrl(url);
      setIsLoading(true);
      setAudioError(null);
      // Reset error retry count when changing audio source
      errorRetryCount.current = 0;
      
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio();
          audioRef.current.preload = 'auto';
          audioRef.current.crossOrigin = 'anonymous';
        }
        
        // Clean up the current audio element before setting a new source
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        
        // Update audio source with proper error handling
        audioRef.current.src = url;
        audioRef.current.load();
        
        audioRef.current.oncanplaythrough = () => {
          console.log('Audio can play through now');
          setIsLoading(false);
        };
        
        audioRef.current.onerror = (e) => {
          console.error('Audio loading error:', audioRef.current?.error);
          setAudioError(`Failed to load audio: ${audioRef.current?.error?.message || 'Unknown error'}`);
          setIsLoading(false);
        };
        
      } catch (error) {
        console.error('Audio setup error:', error);
        setAudioError('Failed to initialize audio');
        setIsLoading(false);
      }
    };
    
    setupAudio();
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
