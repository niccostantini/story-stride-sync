
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
      
      // Don't change the audio source if it's already loaded
      if (audioRef.current && audioRef.current.src === url && !audioRef.current.error) {
        setIsLoading(false);
        return;
      }
      
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
        const loadPromise = new Promise<void>((resolve, reject) => {
          const loadHandler = () => {
            audioRef.current?.removeEventListener('canplaythrough', loadHandler);
            resolve();
          };
          
          const errorHandler = (err: Event) => {
            audioRef.current?.removeEventListener('error', errorHandler as EventListener);
            reject(new Error('Failed to load audio'));
          };
          
          if (audioRef.current) {
            audioRef.current.addEventListener('canplaythrough', loadHandler);
            audioRef.current.addEventListener('error', errorHandler as EventListener);
            audioRef.current.src = url;
            audioRef.current.load();
            audioRef.current.volume = 1.0;
          }
        });
        
        // We don't await this promise to avoid blocking the UI
        loadPromise
          .then(() => setIsLoading(false))
          .catch(err => {
            console.warn('Audio loading failed:', err);
            // Don't reset to silent audio here, let the error event handler do it
          });
          
      } catch (error) {
        console.error('Audio setup error:', error);
        setAudioError('Failed to initialize audio');
        setIsLoading(false);
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
