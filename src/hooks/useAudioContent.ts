
import { useState, useEffect, useRef } from 'react';
import { getSilentAudioUrl, createAudioUrl, revokeAudioUrl } from '@/services/audioUtils';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for managing audio content loading and cleanup
 */
export const useAudioContent = (audioUrl: string | string[] | null) => {
  const [processedUrls, setProcessedUrls] = useState<string[]>([]);
  const [isPreloading, setIsPreloading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const preloadedAudioRefs = useRef<HTMLAudioElement[]>([]);
  const { toast } = useToast();
  
  // Process and preload audio content
  useEffect(() => {
    // Reset state when audio source changes
    setProcessedUrls([]);
    setLoadingProgress(0);
    
    // Clean up any previously preloaded audio elements
    preloadedAudioRefs.current.forEach(audio => {
      audio.src = '';
      audio.load();
    });
    preloadedAudioRefs.current = [];
    
    if (!audioUrl) return;
    
    const urls = Array.isArray(audioUrl) ? audioUrl : [audioUrl];
    if (urls.length === 0) return;
    
    // Start preloading process
    setIsPreloading(true);
    
    const preloadAudioFiles = async () => {
      const processed: string[] = [];
      let loadedCount = 0;
      
      // Process each URL sequentially
      for (const url of urls) {
        try {
          // Create a new audio element for preloading
          const audio = new Audio();
          
          // Track loading progress
          audio.addEventListener('canplaythrough', () => {
            loadedCount++;
            setLoadingProgress(Math.floor((loadedCount / urls.length) * 100));
          });
          
          // Handle loading errors
          audio.addEventListener('error', () => {
            console.warn(`Failed to preload audio: ${url}`);
            loadedCount++;
            setLoadingProgress(Math.floor((loadedCount / urls.length) * 100));
          });
          
          // Start loading
          audio.src = url;
          audio.load();
          
          // Store for later cleanup
          preloadedAudioRefs.current.push(audio);
          processed.push(url);
        } catch (error) {
          console.error('Audio preloading error:', error);
          // Use silent audio as fallback
          processed.push(getSilentAudioUrl());
        }
      }
      
      setProcessedUrls(processed);
      setIsPreloading(false);
      
      if (processed.length > 0) {
        toast({
          title: "Audio Ready",
          description: `${processed.length} audio files prepared for playback`,
        });
      }
    };
    
    preloadAudioFiles();
    
    // Cleanup function
    return () => {
      preloadedAudioRefs.current.forEach(audio => {
        audio.src = '';
        audio.load();
      });
      preloadedAudioRefs.current = [];
    };
  }, [audioUrl, toast]);
  
  // Get the appropriate URL for the current set
  const getUrlForSet = (setIndex: number): string => {
    if (!processedUrls.length) return getSilentAudioUrl();
    
    // For single URL
    if (processedUrls.length === 1) return processedUrls[0];
    
    // For array of URLs, return the corresponding one or the last one
    const index = Math.min(setIndex, processedUrls.length - 1);
    return processedUrls[index];
  };
  
  return {
    processedUrls,
    isPreloading,
    loadingProgress,
    getUrlForSet
  };
};
