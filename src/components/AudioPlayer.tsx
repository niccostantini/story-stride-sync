
import React, { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Timer } from '@/types';
import AudioControls from './audio/AudioControls';
import AudioStatus from './audio/AudioStatus';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

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
  const isDevMode = window.location.hostname === 'localhost';
  
  const {
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
    forcedPlay
  } = useAudioPlayer(audioUrl, timer, onPlay, onPause);
  
  // Initialize audio element when URL changes or timer state changes
  useEffect(() => {
    const currentUrl = getCurrentAudioUrl();
    
    if (currentUrl) {
      console.log('Setting audio URL:', currentUrl);
      setIsLoading(true);
      setAudioError(null);
      
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        
        // Configure audio element
        audioRef.current.preload = 'auto';
        audioRef.current.crossOrigin = 'anonymous'; // Try to avoid CORS issues
        
        // Set the source - handle both data URLs and blob URLs
        audioRef.current.src = currentUrl;
        
        // Manually attempt to load the audio
        audioRef.current.load();
        
        // Explicitly setting volume
        audioRef.current.volume = 1.0;
      } catch (error) {
        console.error('Error setting up audio element:', error);
        setAudioError('Failed to initialize audio player');
        setIsLoading(false);
      }
    } else {
      console.log('No audio URL available');
      setAudioError('No audio available');
      setIsLoading(false);
    }
  }, [audioUrl, timer?.currentSetIndex]);
  
  // Add visible HTML audio element for debugging
  useEffect(() => {
    // Create a visible audio element for browser controls
    const createVisibleAudioElement = () => {
      const currentUrl = getCurrentAudioUrl();
      
      if (currentUrl && !document.getElementById('visible-audio-element')) {
        // Remove any existing element
        const existingElement = document.getElementById('visible-audio-element');
        if (existingElement && existingElement.parentNode) {
          existingElement.parentNode.removeChild(existingElement);
        }
        
        // Create a new audio element
        const audioElement = document.createElement('audio');
        audioElement.id = 'visible-audio-element';
        audioElement.controls = true;
        audioElement.style.width = '100%';
        audioElement.style.marginBottom = '10px';
        audioElement.style.display = 'none'; // Hide by default in production
        audioElement.src = currentUrl;
        
        // In development mode, make it visible
        if (isDevMode) {
          audioElement.style.display = 'block';
        }
        
        // Add to DOM
        const container = document.querySelector('.audio-debug-container');
        if (container) {
          container.appendChild(audioElement);
        }
      }
    };
    
    createVisibleAudioElement();
    
    return () => {
      const elem = document.getElementById('visible-audio-element');
      if (elem && elem.parentNode) {
        elem.parentNode.removeChild(elem);
      }
    };
  }, [audioUrl, timer?.currentSetIndex, isDevMode]);
  
  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleCanPlay = () => {
      console.log('Audio can play now');
      setIsLoading(false);
      toast({
        title: "Audio ready",
        description: "Your story audio is ready to play",
      });
    };
    
    const handleError = (e: Event) => {
      const error = (e.target as HTMLAudioElement).error;
      console.error('Audio playback error:', error);
      console.error('Audio src that failed:', audio.src);
      setAudioError('Failed to load audio');
      setIsLoading(false);
      
      toast({
        title: "Audio Error",
        description: `Could not play audio: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
      
      // Reset to a valid silent audio clip
      audio.src = 'data:audio/mp3;base64,SUQzAwAAAAABOlRJVDIAAAAZAAADSW5zdHJ1bWVudGFsIFNvdW5kIEZYAA==';
      audio.load();
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
    audio.addEventListener('playing', () => console.log('Audio is playing'));
    audio.addEventListener('waiting', () => console.log('Audio is waiting'));
    audio.addEventListener('stalled', () => console.log('Audio is stalled'));
    
    return () => {
      // Remove event listeners
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('playing', () => console.log('Audio is playing'));
      audio.removeEventListener('waiting', () => console.log('Audio is waiting'));
      audio.removeEventListener('stalled', () => console.log('Audio is stalled'));
    };
  }, [timer, onPause, toast]);
  
  // Synchronize audio with timer state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !timer) return;
    
    console.log('Timer state changed:', { 
      isRunning: timer.isRunning, 
      isPaused: timer.isPaused,
      isInPause: timer.isInPause,
      isInRest: timer.isInRest
    });
    
    // Handle normal play/pause based on timer
    if (timer.isRunning && !timer.isPaused) {
      if (timer.isInPause || timer.isInRest) {
        // If we're in a pause or rest period, pause the audio
        console.log('Timer in pause or rest period, pausing audio');
        audio.pause();
      } else {
        // Play the audio if not in pause or rest
        console.log('Playing audio');
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Error playing audio:', error);
            
            // If autoplay is blocked, show a toast notification
            if (error.name === 'NotAllowedError') {
              toast({
                  title: "Autoplay blocked",
                  description: "Please click play to start audio playback",
                  variant: "default",
              });
            } else {
              setAudioError(`Error playing audio: ${error.message}`);
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
