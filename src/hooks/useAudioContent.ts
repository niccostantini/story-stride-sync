
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
    
    if (!audioUrl) {
      // If no audio URL is provided, use silent audio
      console.log('No audio URL provided, using silent audio');
      setProcessedUrls([getSilentAudioUrl()]);
      setIsPreloading(false);
      return;
    }
    
    const urls = Array.isArray(audioUrl) ? audioUrl : [audioUrl];
    if (urls.length === 0) {
      // If empty array, use silent audio
      console.log('Empty audio URL array, using silent audio');
      setProcessedUrls([getSilentAudioUrl()]);
      setIsPreloading(false);
      return;
    }
    
    // Start preloading process
    setIsPreloading(true);
    console.log('Starting audio preloading process with URLs:', urls);
    
    // Directly use the provided URLs if they're already data URLs or URLs
    // This avoids unnecessary processing that might corrupt the audio
    const processed = urls.map(url => {
      // Check if it's already a URL (data: or http: or https: or blob:)
      if (url.startsWith('data:') || url.startsWith('http:') || url.startsWith('https:') || url.startsWith('blob:')) {
        return url;
      }
      
      // If it's a base64 string, convert it to a data URL
      try {
        return createAudioUrl(url);
      } catch (error) {
        console.error('Audio processing error:', error);
        return getSilentAudioUrl();
      }
    });
    
    setProcessedUrls(processed);
    setLoadingProgress(100); // Since we're not actually preloading
    setIsPreloading(false);
    
    console.log('Audio URLs processed:', processed);
    toast({
      title: "Audio Ready",
      description: `Audio prepared for playback`,
    });
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
