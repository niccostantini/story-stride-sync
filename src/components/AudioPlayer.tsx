
import React, { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Timer } from '@/types';
import AudioControls from './audio/AudioControls';
import AudioStatus from './audio/AudioStatus';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { getSilentAudioUrl } from '@/services/audioUtils';

interface AudioPlayerProps {
  audioUrl: string | string[] | null;
  timer: Timer | null;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onDiscard: () => void;
  formatTimeRemaining: () => string;
  getProgress: () => number;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  timer,
  onPlay,
  onPause,
  onReset,
  onDiscard,
  formatTimeRemaining,
  getProgress
}) => {
  const { toast } = useToast();
  const isDevMode = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
  
  const {
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
    forcedPlay
  } = useAudioPlayer(audioUrl, timer, onPlay, onPause);
  
  // Initialize audio element when URL changes or timer state changes
  useEffect(() => {
    const setupAudio = () => {
      // Get the current URL or use silent audio as fallback
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
        }
        
        // If the current src is the same, don't reload
        if (audioRef.current.src === url) {
          setIsLoading(false);
          return;
        }
        
        // Configure audio element
        audioRef.current.preload = 'auto';
        audioRef.current.crossOrigin = 'anonymous';
        
        // Set the source
        audioRef.current.src = url;
        audioRef.current.load();
        
        // Explicitly setting volume
        audioRef.current.volume = 1.0;
      } catch (error) {
        console.error('Error setting up audio element:', error);
        setAudioError('Failed to initialize audio player');
        setIsLoading(false);
        
        // Use silent audio as fallback
        resetToSilentAudio();
      }
    };
    
    setupAudio();
  }, [audioUrl, timer?.currentSetIndex]);
  
  // Add visible HTML audio element for debugging in dev mode
  useEffect(() => {
    const createDebugAudioElement = () => {
      // Remove any existing element
      const existingElement = document.getElementById('visible-audio-element');
      if (existingElement && existingElement.parentNode) {
        existingElement.parentNode.removeChild(existingElement);
      }
      
      if (isDevMode) {
        // Create a new audio element for debugging
        const audioElement = document.createElement('audio');
        audioElement.id = 'visible-audio-element';
        audioElement.controls = true;
        audioElement.style.width = '100%';
        audioElement.style.marginBottom = '10px';
        audioElement.src = getSilentAudioUrl(); // Start with silent audio
        
        // Add to DOM
        const container = document.querySelector('.audio-debug-container');
        if (container) {
          container.appendChild(audioElement);
          
          // Update the src when our main audio element changes
          if (currentAudioUrl) {
            audioElement.src = currentAudioUrl;
          }
        }
      }
    };
    
    createDebugAudioElement();
    
    return () => {
      const elem = document.getElementById('visible-audio-element');
      if (elem && elem.parentNode) {
        elem.parentNode.removeChild(elem);
      }
    };
  }, [isDevMode, currentAudioUrl]);
  
  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    let errorCount = 0;
    const maxErrors = 3;
    
    const handleCanPlay = () => {
      console.log('Audio can play now');
      setIsLoading(false);
      errorCount = 0; // Reset error count on successful load
      
      // No need for toast on every canplay event
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
      
      // Increment error count
      errorCount++;
      
      // Only show error messages if we've hit the threshold
      if (errorCount >= maxErrors) {
        setAudioError(`Could not play audio: ${error?.message || 'Unknown error'}`);
        setIsLoading(false);
        
        toast({
          title: "Audio Error",
          description: `Playback error: ${error?.message || 'Unknown error'}`,
          variant: "destructive",
        });
        
        // Reset to a silent audio
        resetToSilentAudio();
      } else {
        // Try switching to silent audio without showing an error
        console.log(`Audio error #${errorCount}, trying silent audio`);
        resetToSilentAudio();
      }
    };
    
    const handleEnded = () => {
      console.log('Audio playback ended');
      if (timer && timer.isRunning && !timer.isPaused) {
        // Only pause if timer is still running
        onPause();
      }
    };
    
    // Add event listeners
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      // Remove event listeners
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
        // If we're in a pause or rest period, pause the audio
        audio.pause();
      } else {
        // Skip audio playback if there are errors
        if (audioError) return;
        
        // Play the audio if not in pause or rest
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn('Non-critical error playing audio:', error);
            
            // Don't show error for autoplay blocking - it's expected
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
      // Pause audio if timer is paused or not running
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
  
  // Handle reset
  useEffect(() => {
    if (!timer?.isRunning && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [timer?.isRunning]);

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onReset();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AudioStatus
        timer={timer}
        audioError={audioError}
        isLoading={isLoading}
        formatTimeRemaining={formatTimeRemaining}
        getProgress={getProgress}
      />
      
      <AudioControls
        timer={timer}
        isLoading={isLoading}
        audioError={audioError}
        isMuted={isMuted}
        onPlayPause={handlePlayPause}
        onReset={handleReset}
        onMuteToggle={toggleMute}
        onDiscard={onDiscard}
        onDebug={debugAudio}
        onForcedPlay={forcedPlay}
        isDevMode={isDevMode}
      />
    </div>
  );
};

export default AudioPlayer;
