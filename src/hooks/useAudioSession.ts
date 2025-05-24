
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
  const maxSilentAudioAttempts = 2;
  const isSettingSource = useRef<boolean>(false);
  
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
    if (audioRef.current && !isSettingSource.current) {
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
        isSettingSource.current = true;
        
        // Properly clean up the current audio
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
        
        // Set new silent audio source
        audioRef.current.src = silentUrl;
        audioRef.current.load();
        
        isSettingSource.current = false;
        return silentUrl;
      } catch (err) {
        console.error("Error when resetting to silent audio:", err);
        isSettingSource.current = false;
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
      audioRef.current.preload = 'metadata';
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
    if (!processedUrls.length || isSettingSource.current) return;
    
    const setupAudio = async () => {
      const url = getCurrentAudioUrl();
      
      if (!url) {
        setAudioError("No audio available");
        setIsLoading(false);
        return;
      }
      
      // Don't change the audio source if it's already the same URL
      if (audioRef.current && audioRef.current.src === url) {
        console.log('Audio source already set to:', url.substring(0, 50) + '...');
        setIsLoading(false);
        return;
      }
      
      console.log('Setting up audio with URL:', url.substring(0, 50) + '...');
      setCurrentAudioUrl(url);
      setIsLoading(true);
      setAudioError(null);
      errorRetryCount.current = 0;
      
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio();
          audioRef.current.preload = 'metadata';
          audioRef.current.crossOrigin = 'anonymous';
        }
        
        // Prevent multiple source changes
        isSettingSource.current = true;
        
        // Clean up the current audio element before setting a new source
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        
        // Remove existing event listeners to prevent conflicts
        audioRef.current.oncanplaythrough = null;
        audioRef.current.onerror = null;
        audioRef.current.onloadedmetadata = null;
        
        // Update audio source
        audioRef.current.src = url;
        audioRef.current.load();
        
        // Set up event listeners
        audioRef.current.onloadedmetadata = () => {
          console.log('Audio metadata loaded, duration:', audioRef.current?.duration);
          if (audioRef.current && audioRef.current.duration && audioRef.current.duration !== Infinity) {
            setIsLoading(false);
            isSettingSource.current = false;
          }
        };
        
        audioRef.current.oncanplaythrough = () => {
          console.log('Audio can play through now');
          setIsLoading(false);
          isSettingSource.current = false;
        };
        
        audioRef.current.onerror = (e) => {
          console.error('Audio loading error:', audioRef.current?.error);
          setAudioError(`Audio playback unavailable - continuing without sound`);
          setIsLoading(false);
          isSettingSource.current = false;
        };
        
        // Fallback timeout in case metadata never loads
        setTimeout(() => {
          if (isSettingSource.current) {
            console.log('Audio loading timeout, proceeding anyway');
            setIsLoading(false);
            isSettingSource.current = false;
          }
        }, 3000);
        
      } catch (error) {
        console.error('Audio setup error:', error);
        setAudioError('Failed to initialize audio');
        setIsLoading(false);
        isSettingSource.current = false;
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
